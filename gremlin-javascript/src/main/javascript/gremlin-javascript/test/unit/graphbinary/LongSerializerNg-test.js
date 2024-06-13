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
import { longSerializerNg as longSerializer } from '../../../lib/structure/io/binary/GraphBinary.js';

const { from, concat } = Buffer;

describe('GraphBinary.LongSerializerNg', () => {

  const type_code =  from([0x02]);
  const value_flag = from([0x00]);

  const cases = [
    { v:undefined,                            fq:1, b:[0x02,0x01],           av:null },
    { v:undefined,                            fq:0, b:[0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00], av:0n },
    { v:null,                                 fq:1, b:[0x02,0x01] },
    { v:null,                                 fq:0, b:[0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00], av:0n },
    { v:0n,                                         b:[0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00] },
    { v:1n,                                         b:[0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01] },
    { v:256n,                                       b:[0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x00] },
    { v:65536n,                                     b:[0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x00] },
    { v:16777216n,                                  b:[0x00,0x00,0x00,0x00,0x01,0x00,0x00,0x00] },
    { v:4294967296n,                                b:[0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x00] },
    { v:1099511627776n,                             b:[0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00] },
    { v:281474976710656n,                           b:[0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00] },
    { v:72057594037927936n,                         b:[0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00] },
    { v:9223372036854775807n,                       b:[0x7F,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF] },
    { v:-1n,                                        b:[0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF] },
    { v:-9223372036854775808n,                      b:[0x80,0x00,0x00,0x00,0x00,0x00,0x00,0x00] },

    { des:1, err:/buffer is missing/,         fq:1, b:undefined },
    { des:1, err:/buffer is missing/,         fq:0, b:undefined },
    { des:1, err:/buffer is missing/,         fq:1, b:null },
    { des:1, err:/buffer is missing/,         fq:0, b:null },
    { des:1, err:/buffer is empty/,           fq:1, b:[] },
    { des:1, err:/buffer is empty/,           fq:0, b:[] },

    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x00] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x01] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x03] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x20] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0x82] },
    { des:1, err:/unexpected {type_code}/,    fq:1, b:[0xFF] },

    { des:1, err:/{value_flag} is missing/,   fq:1, b:[0x02] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x02,0x10] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x02,0x02] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x02,0x0F] },
    { des:1, err:/unexpected {value_flag}/,   fq:1, b:[0x02,0xFF] },

    { des:1, err:/unexpected {value} length/, fq:1, b:[0x02,0x00] },
    { des:1, err:/unexpected {value} length/,       b:[0x11] },
    { des:1, err:/unexpected {value} length/,       b:[0x11,0x22,0x33,0x44,0x55,0x66,0x77] },
  ];

  describe('#serialize', () =>
    cases
    .filter(({des}) => !des)
    .forEach(({ v, fq, b }, i) => it(ser_title({i,v}), () => {
      b = from(b);

      // when fq is under control
      if (fq !== undefined) {
        assert.deepEqual( longSerializer.serialize(v, fq), b );
        return;
      }

      // generic case
      assert.deepEqual( longSerializer.serialize(v, true),  concat([type_code, value_flag, b]) );
      assert.deepEqual( longSerializer.serialize(v, false), concat([                       b]) );
    }))
  );

  describe('#deserialize', () =>
    cases.forEach(({ v, fq, b, av, err }, i) => it(des_title({i,b}), () => {
      if (Array.isArray(b))
        b = from(b);

      // wrong binary
      if (err !== undefined) {
        if (fq !== undefined)
          assert.throws(() => longSerializer.deserialize(b, fq), { message: err });
        else {
          assert.throws(() => longSerializer.deserialize(concat([type_code, value_flag, b]), true),  { message: err });
          assert.throws(() => longSerializer.deserialize(concat([                       b]), false), { message: err });
        }
        return;
      }

      if (av !== undefined)
        v = av;
      const len = b.length;

      // when fq is under control
      if (fq !== undefined) {
        assert.deepStrictEqual( longSerializer.deserialize(b, fq), {v,len} );
        return;
      }

      // generic case
      assert.deepStrictEqual( longSerializer.deserialize(concat([type_code, value_flag, b]), true),  {v,len:len+2} );
      assert.deepStrictEqual( longSerializer.deserialize(concat([                       b]), false), {v,len:len+0} );
    }))
  );

  describe('#canBeUsedFor', () =>
    it.skip('')
  );

});
