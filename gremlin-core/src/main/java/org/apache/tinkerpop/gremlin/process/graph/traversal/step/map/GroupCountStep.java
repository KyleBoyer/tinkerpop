/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.tinkerpop.gremlin.process.graph.traversal.step.map;

import org.apache.tinkerpop.gremlin.process.Traversal;
import org.apache.tinkerpop.gremlin.process.Traverser;
import org.apache.tinkerpop.gremlin.process.computer.KeyValue;
import org.apache.tinkerpop.gremlin.process.computer.MapReduce;
import org.apache.tinkerpop.gremlin.process.computer.traversal.TraversalVertexProgram;
import org.apache.tinkerpop.gremlin.process.computer.util.StaticMapReduce;
import org.apache.tinkerpop.gremlin.process.graph.traversal.step.util.ReducingBarrierStep;
import org.apache.tinkerpop.gremlin.process.traversal.step.MapReducer;
import org.apache.tinkerpop.gremlin.process.traversal.step.TraversalParent;
import org.apache.tinkerpop.gremlin.process.traversal.util.TraversalHelper;
import org.apache.tinkerpop.gremlin.process.traversal.util.TraversalUtil;
import org.apache.tinkerpop.gremlin.process.traverser.TraverserRequirement;
import org.apache.tinkerpop.gremlin.process.util.MapHelper;
import org.apache.tinkerpop.gremlin.process.util.TraverserSet;
import org.apache.tinkerpop.gremlin.structure.Vertex;
import org.apache.tinkerpop.gremlin.util.function.HashMapSupplier;

import java.io.Serializable;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.BiFunction;

/**
 * @author Marko A. Rodriguez (http://markorodriguez.com)
 */
public final class GroupCountStep<S, E> extends ReducingBarrierStep<S, Map<E, Long>> implements MapReducer, TraversalParent {

    private Traversal.Admin<S, E> groupTraversal = null;

    public GroupCountStep(final Traversal.Admin traversal) {
        super(traversal);
        this.setSeedSupplier(HashMapSupplier.instance());
        this.setBiFunction(new GroupCountBiFunction());
    }


    @Override
    public void addLocalChild(final Traversal.Admin<?, ?> groupTraversal) {
        this.groupTraversal = this.integrateChild(groupTraversal);
    }

    @Override
    public List<Traversal.Admin<S, E>> getLocalChildren() {
        return null == this.groupTraversal ? Collections.emptyList() : Collections.singletonList(this.groupTraversal);
    }

    @Override
    public Set<TraverserRequirement> getRequirements() {
        return this.getSelfAndChildRequirements(TraverserRequirement.BULK);
    }

    @Override
    public MapReduce<E, Long, E, Long, Map<E, Long>> getMapReduce() {
        return GroupCountMapReduce.instance();
    }

    @Override
    public GroupCountStep<S, E> clone() {
        final GroupCountStep<S, E> clone = (GroupCountStep<S, E>) super.clone();
        if (null != this.groupTraversal)
            clone.groupTraversal = clone.integrateChild(this.groupTraversal.clone());
        return clone;
    }

    @Override
    public Traverser<Map<E, Long>> processNextStart() {
        if (this.byPass) {
            final Traverser.Admin<S> traverser = this.starts.next();
            return traverser.asAdmin().split(TraversalUtil.applyNullable(traverser, (Traversal.Admin<S, Map<E, Long>>) this.groupTraversal), this);
        } else {
            return super.processNextStart();
        }
    }

    @Override
    public String toString() {
        return TraversalHelper.makeStepString(this, this.groupTraversal);
    }

    ///////////

    private class GroupCountBiFunction implements BiFunction<Map<E, Long>, Traverser<S>, Map<E, Long>>, Serializable {

        private GroupCountBiFunction() {

        }

        @Override
        public Map<E, Long> apply(final Map<E, Long> mutatingSeed, final Traverser<S> traverser) {
            MapHelper.incr(mutatingSeed, TraversalUtil.applyNullable(traverser.asAdmin(), GroupCountStep.this.groupTraversal), traverser.bulk());
            return mutatingSeed;
        }
    }

    ///////////

    public static final class GroupCountMapReduce<E> extends StaticMapReduce<E, Long, E, Long, Map<E, Long>> {

        private static final GroupCountMapReduce INSTANCE = new GroupCountMapReduce();

        private GroupCountMapReduce() {

        }

        @Override
        public boolean doStage(final Stage stage) {
            return true;
        }

        @Override
        public void map(final Vertex vertex, final MapEmitter<E, Long> emitter) {
            vertex.<TraverserSet<E>>property(TraversalVertexProgram.HALTED_TRAVERSERS).ifPresent(traverserSet -> traverserSet.forEach(traverser -> emitter.emit(traverser.get(), traverser.bulk())));
        }

        @Override
        public void reduce(final E key, final Iterator<Long> values, final ReduceEmitter<E, Long> emitter) {
            long counter = 0;
            while (values.hasNext()) {
                counter = counter + values.next();
            }
            emitter.emit(key, counter);
        }

        @Override
        public void combine(final E key, final Iterator<Long> values, final ReduceEmitter<E, Long> emitter) {
            reduce(key, values, emitter);
        }

        @Override
        public Map<E, Long> generateFinalResult(final Iterator<KeyValue<E, Long>> keyValues) {
            final Map<E, Long> map = new HashMap<>();
            keyValues.forEachRemaining(keyValue -> map.put(keyValue.getKey(), keyValue.getValue()));
            return map;
        }

        @Override
        public String getMemoryKey() {
            return REDUCING;
        }

        public static final <E> GroupCountMapReduce<E> instance() {
            return INSTANCE;
        }
    }

}