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
package org.apache.tinkerpop.gremlin.driver;

import io.netty.handler.codec.http.FullHttpRequest;
import io.netty.handler.codec.http.HttpHeaderNames;

import java.util.Base64;

public abstract class Auth implements RequestInterceptor {

    public static Auth basic(final String username, final String password) {
        return new Basic(username, password);
    }

    public static class Basic extends Auth {

        private final String username;
        private final String password;

        private Basic(final String username, final String password ) {
            this.username = username;
            this.password = password;
        }

        @Override
        public FullHttpRequest apply(FullHttpRequest fullHttpRequest) {
            final String valueToEncode = username + ":" + password;
            fullHttpRequest.headers().add(HttpHeaderNames.AUTHORIZATION,
                    "Basic " + Base64.getEncoder().encodeToString(valueToEncode.getBytes()));
            return fullHttpRequest;
        }
    }
}
