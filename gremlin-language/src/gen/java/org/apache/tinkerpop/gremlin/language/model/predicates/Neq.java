package org.example.org.apache.tinkerpop.gremlin.language.model.predicates;

import org.example.org.apache.tinkerpop.gremlin.language.model.literals.GenericLiteral;

/**
 * @type org/apache/tinkerpop/gremlin/language/model/literals.GenericLiteral
 */
public class Neq {
    public final GenericLiteral genericLiteral;
    
    /**
     * Constructs an immutable Neq object
     */
    public Neq(GenericLiteral genericLiteral) {
        this.genericLiteral = genericLiteral;
    }
    
    @Override
    public boolean equals(Object other) {
        if (!(other instanceof Neq)) return false;
        Neq o = (Neq) other;
        return genericLiteral.equals(o.genericLiteral);
    }
    
    @Override
    public int hashCode() {
        return 2 * genericLiteral.hashCode();
    }
}
