/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

package org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.script;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversal;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.script.ScriptGraphTraversal;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.script.ScriptGraphTraversalSource;
import org.junit.Test;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Marko A. Rodriguez (http://markorodriguez.com)
 */
public class ScriptGraphTraversalSourceTest {

    private static Set<String> NO_GRAPH = new HashSet<>(Arrays.asList("clone", "iterate"));

    @Test
    public void scriptGraphTraversalSourceShouldHaveMethodsOfGraphTraversalSource() {
        for (Method methodA : GraphTraversalSource.class.getMethods()) {
            if ((GraphTraversal.class.isAssignableFrom(methodA.getReturnType()) || GraphTraversalSource.class.isAssignableFrom(methodA.getReturnType())) && !NO_GRAPH.contains(methodA.getName())) {
                boolean found = false;
                final String methodAName = methodA.getName();
                final String methodAParameters = Arrays.asList(methodA.getParameterTypes()).toString();
                for (final Method methodB : ScriptGraphTraversalSource.class.getDeclaredMethods()) {
                    final String methodBName = methodB.getName();
                    final String methodBParameters = Arrays.asList(methodB.getParameterTypes()).toString();
                    if (methodAName.equals(methodBName) && methodAParameters.equals(methodBParameters))
                        found = true;
                }
                if (!found)
                    throw new IllegalStateException(ScriptGraphTraversal.class.getSimpleName() + " is missing the following method: " + methodAName + ":" + methodAParameters);
            }
        }
    }
}
