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

/**
 * @author Igor Ostapenko
 */

import { ser_title, des_title } from './utils.js';
import assert from 'assert';
import { floatSerializer } from '../../../lib/structure/io/binary/GraphBinary.js';

const { from, concat } = Buffer;

describe('GraphBinary.FloatSerializer', () => {

  const type_code =  from([0x08]);
  const value_flag = from([0x00]);

  const cases = [
    { v:undefined,                            fq:1, b:[0x08,0x01],           av:null },
    { v:undefined,                            fq:0, b:[0x00,0x00,0x00,0x00], av:0 },
    { v:null,                                 fq:1, b:[0x08,0x01] },
    { v:null,                                 fq:0, b:[0x00,0x00,0x00,0x00], av:0 },

    { v:1,                                          b:[0x3F,0x80,0x00,0x00] },
    { v:0.375,                                      b:[0x3E,0xC0,0x00,0x00] },
    { v:Infinity,                                   b:[0x7F,0x80,0x00,0x00] },
    { v:-Infinity,                                  b:[0xFF,0x80,0x00,0x00] },
    { v:NaN,                                        b:[0x7F,0xC0,0x00,0x00] },

    { des:1, err:/buffer is missing/,         fq:1, b:undefined },
    { des:1, err:/buffer is missing/,         fq:0, b:undefined },
    { des:1, err:/buffer is missing/,         fq:1, b:null },
    { des:1, err:/buffer is missing/,         fq:0, b:null },
    { des:1, err:/buffer is empty/,           fq:1, b:[] },
    { des:1, err:/buffer is empty/,           fq:0, b:[] },

    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x00] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x07] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x09] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x80] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x88] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0xFF] },

    { des:1, err:/{value_flag} is missing/,   fq:1, b:[0x08] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x08,0x10] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x08,0x02] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x08,0x0F] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x08,0xFF] },

    { des:1, err:/unexpected {value} length/, fq:1, b:[0x08,0x00] },
    { des:1, err:/unexpected {value} length/,       b:[0x11] },
    { des:1, err:/unexpected {value} length/,       b:[0x11,0x22,0x33] },
  ];

  describe('#serialize', () =>
    cases
    .filter(({des}) => !des)
    .forEach(({ v, fq, b }, i) => it(ser_title({i,v}), () => {
      b = from(b);

      // when fq is under control
      if (fq !== undefined) {
        assert.deepEqual( floatSerializer.serialize(v, fq), b );
        return;
      }

      // generic case
      assert.deepEqual( floatSerializer.serialize(v, true),  concat([type_code, value_flag, b]) );
      assert.deepEqual( floatSerializer.serialize(v, false), concat([                       b]) );
    }))
  );

  describe('#deserialize', () =>
    cases.forEach(({ v, fq, b, av, err }, i) => it(des_title({i,b}), () => {
      if (Array.isArray(b))
        b = from(b);

      // wrong binary
      if (err !== undefined) {
        if (fq !== undefined)
          assert.throws(() => floatSerializer.deserialize(b, fq), { message: err });
        else {
          assert.throws(() => floatSerializer.deserialize(concat([type_code, value_flag, b]), true),  { message: err });
          assert.throws(() => floatSerializer.deserialize(concat([                       b]), false), { message: err });
        }
        return;
      }

      if (av !== undefined)
        v = av;
      const len = b.length;

      // when fq is under control
      if (fq !== undefined) {
        assert.deepStrictEqual( floatSerializer.deserialize(b, fq), {v,len} );
        return;
      }

      // generic case
      assert.deepStrictEqual( floatSerializer.deserialize(concat([type_code, value_flag, b]), true),  {v,len:len+2} );
      assert.deepStrictEqual( floatSerializer.deserialize(concat([                       b]), false), {v,len:len+0} );
    }))
  );

});
