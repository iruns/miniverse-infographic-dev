// import pg from '../../../utils/pg-connector';
// import php from '../../../utils/php-connector';
// import {simplifyString, diff} from '../../../utils/utils';
//
// import hash from 'object-hash';
//
// import _ from 'lodash';
//
// import chai, {expect} from 'chai';
// import sinon from 'sinon';
// import sinonChai from "sinon-chai";
//
// chai.use(sinonChai);

/*
describe("sql_function_utils", () => {

    describe.skip("check_infographic_function()", () => {

        before(done => {
            pg.connect();
            pg.query(`
                DELETE FROM infographic_functions
                WHERE infographic = ANY (ARRAY['unit_test_1', 'unit_test_2'])
                `);
            pg.query(`
                INSERT INTO infographic_functions(function_name, infographic, version) values
                ('f1', 'unit_test_1', '0.1'),
                ('f1', 'unit_test_1', '0.0'),
                ('f1', 'unit_test_2', '0.0'),
                ('f2', 'unit_test_1', '0.3')
                `, res => done());

        })

        after(done => {
            pg.query(`
                DELETE FROM infographic_functions
                WHERE infographic = ANY (ARRAY['unit_test_1', 'unit_test_2'])
                `);
            pg.endOnComplete(done);
        })

        it("gets 0 if NO same infographic, version, AND function found", done => {

            php.call(
                "utils/sql_function_utils_caller",
                "check_infographic_function",
                {
                    infographic: "unit_test_0",
                    version: "0.0",
                    function_name: "f0"
                },
                res => {
                    res.should.equals("0");
                    done();
                }
            )
        });

        it("gets 1 if NO same infographic found, BUT same function found", done => {

            php.call(
                "utils/sql_function_utils_caller",
                "check_infographic_function",
                {
                    infographic: "unit_test_0",
                    version: "0.0",
                    function_name: "f1"
                },
                res => {
                    res.should.equals("1");
                    done();
                }
            )
        });

        it("gets 2 if same infographic and version found, BUT NO same function found", done => {

            php.call(
                "utils/sql_function_utils_caller",
                "check_infographic_function",
                {
                    infographic: "unit_test_1",
                    version: "0.0",
                    function_name: "f0"
                },
                res => {
                    res.should.equals("2");
                    done();
                }
            )
        });

        it("gets 3 if same infographic, version, AND function found", done => {

            php.call(
                "utils/sql_function_utils_caller",
                "check_infographic_function",
                {
                    infographic: "unit_test_1",
                    version: "0.0",
                    function_name: "f1"
                },
                res => {
                    res.should.equals("3");
                    done();
                }
            )
        });

    })

    describe("sub-functions ->", () => {

        describe("ids_to_array_string()", () => {
            it("works", (done) => {
                let req = {
                    ids_array: [311, {param:0}, 123, {param:1}],
                }

                php.call(
                    "utils/sql_function_utils_caller",
                    "ids_to_array_string",
                    req,
                    res => {
                        res.should.equals("pm0||pm1||ARRAY[311,123]::BIGINT[]");
                        done();
                    }
                );
            });
        })

        describe("props_to_array_string()", () => {

            it("works on filled props", (done) => {
                let req = {
                    props_array: [311, 211, {param:0}, {param:1}, 21],
                }

                php.call(
                    "utils/sql_function_utils_caller",
                    "props_to_array_string",
                    req,
                    res => {
                        res.should.equals("pm0||pm1||ARRAY[311,211,21]::BIGINT[]");
                        done();
                    }
                );
            });

            it("works on empty props", (done) => {
                let req = {
                    props_array: [],
                }

                php.call(
                    "utils/sql_function_utils_caller",
                    "props_to_array_string",
                    req,
                    res => {
                        res.should.equals("");
                        done();
                    }
                );
            });
        })

        describe("generate_get_entities()", () => {

            it("processes class query", (done) => {
                let req = {
                    query: {
                        type: "class",
                        group: 0,
                        classes: [1, 2, {param:1}],
                    },
                }

                let query = `
                    gr0:=ARRAY_CAT(gr0,get_instances_of(pm1||ARRAY[1,2]::BIGINT[]));
                    FOREACH entity_id IN ARRAY gr0
                    LOOP
                        ds.type := 'g';
                        ds.subject := '0';
                        ds.val := entity_id;
                        ds.prop := null;
                        ds.spec1 := null;
                        ds.spec2 := null;
                        ds.rank := null;
                    RETURN NEXT ds;
                    END LOOP;`
                ;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_entities",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            });

            it("processes queries with active value as a parameter", (done) => {
                let req = {
                    query: {
                        active: ":pm1",
                        type: "class",
                        group: 0,
                        classes: [1],
                    },
                }

                let query = `
                    IF (pm1) THEN
                        gr0:=ARRAY_CAT(gr0,get_instances_of(ARRAY[1]::BIGINT[]));
                        FOREACH entity_id IN ARRAY gr0
                        LOOP
                            ds.type := 'g';
                            ds.subject := '0';
                            ds.val := entity_id;
                            ds.prop := null;
                            ds.spec1 := null;
                            ds.spec2 := null;
                            ds.rank := null;
                        RETURN NEXT ds;
                        END LOOP;
                    END IF;`
                ;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_entities",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("processes queries with true active", (done) => {
                let req = {
                    query: {
                        active: true,
                        type: "class",
                        group: 0,
                        classes: [1],
                    },
                }

                let query = `
                    gr0:=ARRAY_CAT(gr0,get_instances_of(ARRAY[1]::BIGINT[]));
                    FOREACH entity_id IN ARRAY gr0
                    LOOP
                        ds.type := 'g';
                        ds.subject := '0';
                        ds.val := entity_id;
                        ds.prop := null;
                        ds.spec1 := null;
                        ds.spec2 := null;
                        ds.rank := null;
                    RETURN NEXT ds;
                    END LOOP;`
                ;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_entities",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("processes queries with active false value", (done) => {
                let req = {
                    query: {
                        active: false,
                        type: "class",
                        group: 0,
                        classes: [1],
                    },
                }

                let query = ``
                ;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_entities",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

        })

        describe("generate_get_props_of_group()", () => {

            it("gets claims", (done) => {
                let req = {
                    $prop_query: [
                        {
                            type: "props",
                            group: 0,
                            identities: [1,{param:2},0,0,0],
                            props: {
                                datetime: [{param:0}, 311],
                                string: [{param:1}],
                                quantity: [21],
                                entity_ref: [],
                            }
                        }
                    ]
                }

                let query = `
                IF (ARRAY_LENGTH(gr0, 1) > 0)
                THEN

                    CREATE TEMP TABLE temp AS (
                        SELECT *
                        FROM get_values(
                            gr0,
                            TRUE,pm2,FALSE,FALSE,FALSE,
                            'en','enwiki',
                            p_datetime_ids := pm0||ARRAY[311]::BIGINT[],
                            p_string_ids := pm1,
                            p_quantity_ids := ARRAY[21]::BIGINT[]
                        )
                    );

                	FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;

                    DROP TABLE temp;

                END IF;
                `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_props_of_group",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            });

            it("gets qualifiers", (done) => {
                let req = {
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,0,0,0,0],
                            props: {
                                datetime: [
                                    {prop: [":pm1", 321], qualifiers:{string: [":pm2"]}},
                                    5711,
                                ],
                                entity_ref: [
                                    {prop: 311, qualifiers:{datetime: [5801]}},
                                ],
                            }
                        }
                    ],
                    idx: 0
                }

                let query = `
                    IF (ARRAY_LENGTH(gr0, 1) > 0)
                    THEN

                        CREATE TEMP TABLE temp AS (
                            SELECT *
                            FROM get_values(
                                gr0,
                                TRUE,FALSE,FALSE,FALSE,FALSE,
                                'en','enwiki',
                                p_datetime_ids := pm1 || ARRAY[321,5711]::BIGINT[],
                                p_entity_ref_ids := ARRAY[311]::BIGINT[]
                            )
                        );

                    	FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;


                        claims = '{}';
                    	FOR row IN SELECT spec1 FROM temp
                    		WHERE prop = ANY(pm1||ARRAY[321]::BIGINT[])
                    	LOOP
                		    claims := ARRAY_APPEND (claims, row.spec1);
                		END LOOP;

                		FOR ds IN
                		    SELECT * FROM get_qualifiers(
                    			claims,
                    			p_string_ids := pm2
                		    )
                		LOOP RETURN NEXT ds; END LOOP;


                        claims = '{}';
                    	FOR row IN SELECT spec1 FROM temp
                    		WHERE prop = ANY(ARRAY[311]::BIGINT[])
                    	LOOP
                		    claims := ARRAY_APPEND (claims, row.spec1);
                		END LOOP;

                		FOR ds IN
                		    SELECT * FROM get_qualifiers(
                    			claims,
                    			p_datetime_ids := ARRAY[5801]::BIGINT[]
                		    )
                		LOOP RETURN NEXT ds; END LOOP;

                        DROP TABLE temp;

                    END IF;
                    `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "generate_get_props_of_group",
                    req,
                    res => {
                        simplifyString(query).should.equals(simplifyString(res));
                        done();
                    }
                );
            });

            // it("gets references", (done) => {
            //     let req = {
            //         lang: "en",
            //         site: "enwiki",
            //         props: [
            //             {
            //                 type: "entity_ref",
            //                 ids: [311] // instance of
            //             },
            //             {
            //                 type: "datetime",
            //                 ids: [5711], // inception
            //             },
            //             {
            //                 type: "datetime",
            //                 ids: [20], // x
            //             },
            //         ],
            //         references: [
            //             {
            //                 type: "datetime",
            //                 ids: [5801]// start time
            //             },
            //             {
            //                 type: "string",
            //                 ids: [10]// x
            //             },
            //         ],
            //         groups: [
            //             {
            //                 identities: [1,0,0,0,0],
            //                 props: {
            //                     datetime: [
            //                         {prop: [":pm1", 321], references:{string: [":pm2"]}},
            //                         5711,
            //                     ],
            //                     entity_ref: [
            //                         {prop: 311, references:{datetime: [5801]}},
            //                     ],
            //                 }
            //             }
            //         ],
            //         idx: 0
            //     }
            //
            //     let query = `
            //         IF (ARRAY_LENGTH(gr0, 1) > 0)
            //         THEN
            //
            //             CREATE TEMP TABLE temp AS (
            //                 SELECT *
            //                 FROM get_values(
            //                     gr0,
            //                     TRUE,FALSE,FALSE,FALSE,FALSE,
            //                     'en','enwiki',
            //                     p_datetime_ids := pm1 || ARRAY[321,5711]::BIGINT[],
            //                     p_entity_ref_ids := ARRAY[311]::BIGINT[]
            //                 )
            //             );
            //
            //         	FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;
            //
            //
            //             claims = '{}';
            //         	FOR row IN SELECT spec1 FROM temp
            //         		WHERE prop = ANY(pm1||ARRAY[321]::BIGINT[])
            //         	LOOP
            //     		    claims := ARRAY_APPEND (claims, row.spec1);
            //     		END LOOP;
            //
            //     		FOR ds IN
            //     		    SELECT * FROM get_references(
            //         			claims,
            //         			p_string_ids := pm2
            //     		    )
            //     		LOOP RETURN NEXT ds; END LOOP;
            //
            //
            //             claims = '{}';
            //         	FOR row IN SELECT spec1 FROM temp
            //         		WHERE prop = ANY(ARRAY[311]::BIGINT[])
            //         	LOOP
            //     		    claims := ARRAY_APPEND (claims, row.spec1);
            //     		END LOOP;
            //
            //     		FOR ds IN
            //     		    SELECT * FROM get_references(
            //         			claims,
            //         			p_datetime_ids := ARRAY[5801]::BIGINT[]
            //     		    )
            //     		LOOP RETURN NEXT ds; END LOOP;
            //
            //             DROP TABLE temp;
            //
            //         END IF;
            //         `;
            //
            //     php.call(
            //         "utils/sql_function_utils_caller",
            //         "generate_get_props_of_group",
            //         req,
            //         res => {
            //             simplifyString(query).should.equals(simplifyString(res));
            //             done();
            //         }
            //     );
            // });

        })

        describe("generate_save_values()", () => {

        })
    })

    describe.skip("create_infographic_function()", () => {


        describe("working with only selection ->", () => {

            it("with selection ids as params", (done) => {

                let req = {
                    function_name: "i_f_0",
                    paramTypes: [
                        "ids"
                    ],
                    queries: [
                        {
                            type: 'group',
                            group: {param: 0},
                            identities: [1,1,0,0,0]
                        },
                    ],
                }

                let resultFunction = `
                    CREATE FUNCTION i_f_0 (

                        p_lang labels.language%TYPE = 'en',
                        p_site sitelinks.site%TYPE = 'enwiki',

                        pm0 BIGINT[]

                    )
                    RETURNS SETOF data_set
                    AS $$
                    DECLARE
                        ds data_set%ROWTYPE;
                        row RECORD;
                        entity_id BIGINT;
                        claims VARCHAR(127)[];

                    BEGIN

                        IF (ARRAY_LENGTH(gr0, 1) > 0)
                        THEN

                            CREATE TEMP TABLE temp AS (
                                SELECT *
                                FROM get_values(
                                    pm0,
                                    TRUE,TRUE,FALSE,FALSE,FALSE,
                                    p_lang,p_site
                                )
                            );

                        	FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;

                            DROP TABLE temp;

                        END IF;

                        RETURN;

                    END; $$

                    LANGUAGE 'plpgsql';
                `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        simplifyString(resultFunction).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("with properties", (done) => {

                let req = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,1,0,0,0],
                            props: {
                                datetime: [5711]
                            }
                        },
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [":pm0"],
                        },
                    ],
                    paramTypes: [
                        "ids"
                    ],
                }

                let resultFunction = `
                    CREATE FUNCTION i_f_0 (

                        pm0 BIGINT[]

                    )
                    RETURNS SETOF data_set
                    AS $$
                    DECLARE
                        ds data_set%ROWTYPE;
                        row RECORD;
                        entity_id BIGINT;
                        claims VARCHAR(127)[];

                        gr0 BIGINT[] = ARRAY[]::BIGINT[];

                    BEGIN

                        gr0 := pm0;

                        IF (ARRAY_LENGTH(gr0, 1) > 0)
                        THEN
                            CREATE TEMP TABLE temp AS (
                                SELECT *
                                FROM get_values(

                                    gr0,

                                    TRUE,
                                    TRUE,
                                    FALSE,
                                    FALSE,
                                    FALSE,

                                    'en',
                                    'enwiki',

                                    p_datetime_ids := ARRAY[5711]::BIGINT[]
                                )
                            );
                        	FOR ds IN SELECT * FROM temp LOOP RETURN NEXT ds; END LOOP;

                            DROP TABLE temp;
                        END IF;

                        RETURN;

                    END; $$

                    LANGUAGE 'plpgsql';
                `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        simplifyString(resultFunction).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("with qualifiers", (done) => {

                let req = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,1,0,0,0],
                            props: {
                                entity_ref: [
                                    {prop: 311, qualifiers:{datetime: [5801]}},
                                ],
                            }
                        },
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [":pm0"],
                        },
                    ],
                    paramTypes: [
                        "ids"
                    ],
                }

                let resultFunction = `
                    CREATE FUNCTION i_f_0 (

                	    pm0 BIGINT[]

                	)
                	RETURNS SETOF data_set
                	AS $$
                	DECLARE
                	    ds data_set%ROWTYPE;
                	    row RECORD;
                        entity_id BIGINT;
                	    claims VARCHAR(127)[];

                	    gr0 BIGINT[] = ARRAY[]::BIGINT[];

                	BEGIN

                	    gr0 := pm0;

                	    IF (ARRAY_LENGTH(gr0, 1) > 0)
                	    THEN
                    		CREATE TEMP TABLE temp AS (
                    		    SELECT *
                    		    FROM get_values(

                        			gr0,

                        			TRUE,
                        			TRUE,
                        			FALSE,
                        			FALSE,
                        			FALSE,

                        			'en',
                        			'enwiki',

                        			p_entity_ref_ids := ARRAY[311]::BIGINT[]
                    		    )
                    		);

                    		FOR ds IN
                    		    SELECT * FROM temp
                            LOOP RETURN NEXT ds; END LOOP;

                            -- collect claims to get claim details

                            claims = '{}';
                    		FOR row IN
                    			SELECT spec1
                    			FROM temp
                    			WHERE prop = ANY(ARRAY[311]::BIGINT[])
                    		LOOP
                    		    claims := ARRAY_APPEND (claims, row.spec1);
                    		END LOOP;

                    		FOR ds IN
                    		    SELECT *
                    		    FROM get_qualifiers(

                        			claims,

                        			p_datetime_ids := ARRAY[5801]::BIGINT[]
                    		    )
                    		LOOP RETURN NEXT ds; END LOOP;

                    		DROP TABLE temp;
                	    END IF;

                	    RETURN;

                	END; $$

                	LANGUAGE 'plpgsql';
                    `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        simplifyString(resultFunction).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("with references", (done) => {
            //
            //     let req = {
            //         function_name: "i_f_0",
            //         lang: "en",
            //         site: "enwiki",
            //         groups: [
            //             {
            //                 identities: [1,1,0,0,0],
            //                 props: {
            //                     entity_ref: [
            //                         {prop: 311, qualifiers:{datetime: [5801]}},
            //                     ],
            //                 }
            //             },
            //         ],
            //         queries: [
            //             {
            //                 type: "id",
            //                 group: 0,
            //                 ids: [":pm0"],
            //             },
            //         ],
            //         paramTypes: [
            //             "ids"
            //         ],
            //     }
            //
            //     let resultFunction = `
            //         CREATE FUNCTION i_f_0 (
            //
            //     	    pm0 BIGINT[]
            //
            //     	)
            //     	RETURNS SETOF data_set
            //     	AS $$
            //     	DECLARE
            //     	    ds data_set%ROWTYPE;
            //     	    row RECORD;
            //             entity_id BIGINT;
            //     	    claims VARCHAR(127)[];
            //
            //     	    gr0 BIGINT[] = ARRAY[]::BIGINT[];
            //
            //     	BEGIN
            //
            //     	    gr0 := pm0;
            //
            //     	    IF (ARRAY_LENGTH(gr0, 1) > 0)
            //     	    THEN
            //         		CREATE TEMP TABLE temp AS (
            //         		    SELECT *
            //         		    FROM get_values(
            //
            //             			gr0,
            //
            //             			TRUE,
            //             			TRUE,
            //             			FALSE,
            //             			FALSE,
            //             			FALSE,
            //
            //             			'en',
            //             			'enwiki',
            //
            //             			p_entity_ref_ids := ARRAY[311]::BIGINT[]
            //         		    )
            //         		);
            //
            //         		FOR ds IN
            //         		    SELECT * FROM temp
            //                 LOOP RETURN NEXT ds; END LOOP;
            //
            //                 -- collect claims to get claim details
            //
            //                 claims = '{}';
            //         		FOR row IN
            //         			SELECT spec1
            //         			FROM temp
            //         			WHERE prop = ANY(ARRAY[311]::BIGINT[])
            //         		LOOP
            //         		    claims := ARRAY_APPEND (claims, row.spec1);
            //         		END LOOP;
            //
            //         		FOR ds IN
            //         		    SELECT *
            //         		    FROM get_qualifiers(
            //
            //             			claims,
            //
            //             			p_datetime_ids := ARRAY[5801]::BIGINT[]
            //         		    )
            //         		LOOP RETURN NEXT ds; END LOOP;
            //
            //         		DROP TABLE temp;
            //     	    END IF;
            //
            //     	    RETURN;
            //
            //     	END; $$
            //
            //     	LANGUAGE 'plpgsql';
            //         `;
            //
            //     php.call(
            //         "utils/sql_function_utils_caller",
            //         "create_infographic_function",
            //         req,
            //         res => {
            //             simplifyString(resultFunction).should.equals(simplifyString(res));
            //             done();
            //         }
            //     );
            // })

        })

        describe.skip("working with class query ->", () => {

            it("works with class params", (done) => {

                let req = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,1,0,0,0]
                        },
                        {
                            identities: [1,1,0,0,0],
                            props: {
                                entity_ref: [
                                    {prop: 311, qualifiers:{datetime: [5801]}},
                                ],
                            }
                        },
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [":pm0"],
                        },
                        {
                            type: "class",
                            group: 1,
                            classes: [1, [2, 3], ":pm1"],
                        },
                    ],
                    paramTypes: [
                        "ids",
                        "ids"
                    ],
                }

                let resultFunction = `
                CREATE FUNCTION i_f_0 (

                    pm0 BIGINT[],
                    pm1 BIGINT[]

                )
                RETURNS SETOF data_set
                AS $$
                DECLARE
                ds data_set%ROWTYPE;
                row RECORD;
                entity_id BIGINT;
                claims VARCHAR(127)[];

                gr0 BIGINT[] = ARRAY[]::BIGINT[];
                gr1 BIGINT[] = ARRAY[]::BIGINT[];

                BEGIN

                gr0 := pm0;

                IF (ARRAY_LENGTH(gr0, 1) > 0)
                THEN
                CREATE TEMP TABLE temp AS (
                    SELECT *
                    FROM get_values(

                        gr0,

                        TRUE,
                        TRUE,
                        FALSE,
                        FALSE,
                        FALSE,

                        'en',
                        'enwiki'
                    )
                );

                FOR ds IN
                SELECT * FROM temp
                LOOP RETURN NEXT ds; END LOOP;

                DROP TABLE temp;
                END IF;

                gr1 := ARRAY_CAT(gr1, get_instances_of( pm1 || ARRAY[1, 2, 3]::BIGINT[]));
                FOREACH entity_id IN ARRAY gr1
                LOOP

                ds.type := 'g';
                ds.subject := '1';
                ds.val := entity_id;

                ds.prop := null;
                ds.spec1 := null;
                ds.spec2 := null;
                ds.rank := null;

                RETURN NEXT ds;
                END LOOP;

                IF (ARRAY_LENGTH(gr1, 1) > 0)
                THEN
                CREATE TEMP TABLE temp AS (
                    SELECT *
                    FROM get_values(

                        gr1,

                        TRUE,
                        TRUE,
                        FALSE,
                        FALSE,
                        FALSE,

                        'en',
                        'enwiki',

                        p_entity_ref_ids := ARRAY[311]::BIGINT[]
                    )
                );

                FOR ds IN
                SELECT * FROM temp
                LOOP RETURN NEXT ds; END LOOP;

                claims = '{}';
                FOR row IN
                SELECT spec1
                FROM temp
                WHERE prop = ANY(ARRAY[311]::BIGINT[])
                LOOP
                claims := ARRAY_APPEND (claims, row.spec1);
                END LOOP;

                FOR ds IN
                SELECT *
                FROM get_qualifiers(

                    claims,

                    p_datetime_ids := ARRAY[5801]::BIGINT[]
                )
                LOOP RETURN NEXT ds; END LOOP;

                DROP TABLE temp;
                END IF;

                RETURN;

                END; $$

                LANGUAGE 'plpgsql';
                `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        simplifyString(resultFunction).should.equals(simplifyString(res));
                        done();
                    }
                );
            })

            it("works with identity, props, and active params", (done) => {

            let req = {
                function_name: "i_f_0",
                lang: "en",
                site: "enwiki",
                groups: [
                    {
                        identities: [1,1,0,0,0]
                    },
                    {
                        identities: [1,":pm3",0,0,0],
                        props: {
                            entity_ref: [
                                {prop: ":pm4", qualifiers:{datetime: [5801]}},
                            ],
                        }
                    },
                ],
                queries: [
                    {
                        type: "id",
                        group: 0,
                        ids: [":pm0"],
                    },
                    {
                        active: ":pm2",
                        type: "class",
                        group: 1,
                        classes: [1, [2, 3], ":pm1"],
                    },
                ],
                paramTypes: [
                    "ids",
                    "ids",
                    "bool",
                    "bool",
                    "ids",
                ],
            }

            let resultFunction = `
                CREATE FUNCTION i_f_0 (

                    pm0 BIGINT[],
                    pm1 BIGINT[],
                    pm2 BOOLEAN,
                    pm3 BOOLEAN,
                    pm4 BIGINT[]

                )
                RETURNS SETOF data_set
                AS $$
                DECLARE
            	    ds data_set%ROWTYPE;
            	    row RECORD;
                    entity_id BIGINT;
            	    claims VARCHAR(127)[];

                    gr0 BIGINT[]=ARRAY[]::BIGINT[];
                    gr1 BIGINT[]=ARRAY[]::BIGINT[];

                BEGIN

                    gr0 := pm0;

                    IF (ARRAY_LENGTH(gr0, 1) > 0)
                    THEN
                		CREATE TEMP TABLE temp AS (
                		    SELECT *
                		    FROM get_values(

                    			gr0,

                    			TRUE,
                    			TRUE,
                    			FALSE,
                    			FALSE,
                    			FALSE,

                    			'en',
                    			'enwiki'
                		    )
                		);

                		FOR ds IN
                		    SELECT * FROM temp
                        LOOP RETURN NEXT ds; END LOOP;

                		DROP TABLE temp;
                    END IF;

                    IF (pm2) THEN

                        gr1 := ARRAY_CAT(gr1, get_instances_of( pm1 || ARRAY[1, 2, 3]::BIGINT[]));
                        FOREACH entity_id IN ARRAY gr1
                        LOOP

                            ds.type := 'g';
                            ds.subject := '1';
                            ds.val := entity_id;

                            ds.prop := null;
                            ds.spec1 := null;
                            ds.spec2 := null;
                            ds.rank := null;

                        RETURN NEXT ds;
                        END LOOP;
                    END IF;

                    IF (ARRAY_LENGTH(gr1, 1) > 0)
                    THEN
                		CREATE TEMP TABLE temp AS (
                            SELECT *
                            FROM get_values(

                                gr1,

                                TRUE,
                                pm3,
                                FALSE,
                                FALSE,
                                FALSE,

                                'en',
                                'enwiki',

                                p_entity_ref_ids := pm4
                            )
                        );

                		FOR ds IN
                		    SELECT * FROM temp
                        LOOP RETURN NEXT ds; END LOOP;

                        claims = '{}';
                		FOR row IN
                			SELECT spec1
                			FROM temp
                			WHERE prop = ANY(pm4)
                		LOOP
                		    claims := ARRAY_APPEND (claims, row.spec1);
                		END LOOP;

                		FOR ds IN
                		    SELECT *
                		    FROM get_qualifiers(

                    			claims,

                    			p_datetime_ids := ARRAY[5801]::BIGINT[]
                		    )
                		LOOP RETURN NEXT ds; END LOOP;

                		DROP TABLE temp;
                    END IF;

                    RETURN;

                END; $$

                LANGUAGE 'plpgsql';
            `;

            php.call(
                "utils/sql_function_utils_caller",
                "create_infographic_function",
                req,
                res => {
                    simplifyString(resultFunction).should.equals(simplifyString(res));
                    done();
                }
            );
        })
        })


        describe.skip("working with recursive query ->", () => {

            it("works with no params", (done) => {

                let req = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,1,0,0,0],
                            props: {
                                entity_ref: [
                                    {prop: 1711, var:0},
                                ],
                            }
                        },
                        {
                            identities: [1,1,0,0,0]
                        },
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [":pm0"],
                        },
                        {
                            active: ":pm1",
                            type: "recursive",
                            group: 1,

                            entities: [{type:"gr0_props", ids:[1711]}],

                            upProps: [":pm2"],
                            downProps: null,

                            upDepth: ":pm3",
                            downDepth: 1,
                            cousinDepth: 1,
                        },
                    ],
                    paramTypes: [
                        "ids",
                        "bool",
                        "prop_ids",
                        "int"
                    ],
                }

                let req2 = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    varTypes: [
                        "ids",
                    ],
                    paramTypes: [
                        "ids",
                        "bool",
                        "prop_ids",
                        "int"
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [{param:0}],
                            var: 0
                        },
                        {
                            type: 'group',
                            group: 0,
                            identities: [1,1,0,0,0],
                            props: {
                                entity_ref: [
                                    {prop: 1711, var:1},
                                ],
                            }
                        },

                        {
                            active: {param:1},
                            type: "recursive",
                            group: 1,

                            entities: [{var:2}],

                            upProps: [{param:2}],
                            downProps: null,

                            upDepth: {param:3},
                            downDepth: 1,
                            cousinDepth: 1,
                        },
                        {
                            type: 'group',
                            group: 1,
                            identities: [1,1,0,0,0],
                            props: {
                                datetime: [
                                    {prop: 1711, var:6},
                                ],
                            }
                        },

                        {
                            type: "normal",
                            group: 2,

                            subQueries: [
                                {
                                    prop: [1711],
                                    values: [{var:6}],
                                    qualifiers: [{param:4}],
                                }
                            ]
                        },
                        {
                            type: "normal",
                            group: 2,

                            subQueries: [
                                {
                                    prop: [1711],
                                    values: [{var:6}],
                                    qualifiers: [{param:4}],
                                }
                            ]
                        },
                        {
                            type: 'group',
                            group: 2,
                            identities: [1,1,0,0,0],
                        },
                    ],
                }

                let resultFunction = `
                    CREATE FUNCTION i_f_0 (

                        pm0 BIGINT[],
                        pm1 BOOLEAN,
                        pm2 BIGINT[],
                        pm3 INTEGER
                    )
                    RETURNS SETOF data_set
                    AS $$
                    DECLARE
                    ds data_set%ROWTYPE;
                    row RECORD;
                    entity_id BIGINT;
                    claims VARCHAR(127)[];

                    gr0 BIGINT[]=ARRAY[]::BIGINT[];
                    gr1 BIGINT[]=ARRAY[]::BIGINT[];

                    BEGIN

                    gr0 := pm0;

                    IF (ARRAY_LENGTH(gr0, 1) > 0)
                    THEN


                    -- Get selection entities

                    CREATE TEMP TABLE temp AS (
                        SELECT *
                        FROM get_values(

                            gr0,

                            TRUE,
                            TRUE,
                            FALSE,
                            FALSE,
                            FALSE,

                            'en',
                            'enwiki',

                            p_entity_ref_ids:=ARRAY[1711]::BIGINT[]
                        )
                    );

                    FOR ds IN
                    SELECT * FROM temp
                    LOOP RETURN NEXT ds; END LOOP;

                    -- collect selection's claim values and details to get other entities

                    entity_vals = '{}';
                    FOR row IN SELECT spec1 FROM temp
                    WHERE prop = ANY(ARRAY[1711]::BIGINT[])
                    LOOP
                    entity_vals := ARRAY_APPEND (entity_vals, row.val);
                    END LOOP;


                    gr1 := ARRAY_CAT(gr1, get_connected_entities(
                            entity_vals,
                            pm2,
                            p_up_depth:=:pm3,
                            p_down_depth:=1,
                            p_cousin_depth:=1
                        )
                    );

                    FOREACH entity_id IN ARRAY gr1
                    LOOP

                    ds.type := 'g';
                    ds.subject := '1';
                    ds.val := entity_id;

                    ds.prop := null;
                    ds.spec1 := null;
                    ds.spec2 := null;
                    ds.rank := null;

                    RETURN NEXT ds;
                    END LOOP;

                    DROP TABLE temp;
                    DROP TABLE temp2;
                    END IF;

                    IF (ARRAY_LENGTH(gr1, 1) > 0)
                    THEN
                        CREATE TEMP TABLE temp AS (
                            SELECT *
                            FROM get_values(

                                gr1,

                                TRUE,
                                TRUE,
                                FALSE,
                                FALSE,
                                FALSE,

                                'en',
                                'enwiki'
                            )
                        );

                        FOR ds IN
                        SELECT * FROM temp
                        LOOP RETURN NEXT ds; END LOOP;

                        DROP TABLE temp;
                    END IF;

                    RETURN;

                    END; $$

                    LANGUAGE 'plpgsql';
                    `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        // simplifyString(resultFunction).should.equals(simplifyString(res));
                        diff(resultFunction, res);
                        done();
                    }
                );
            })

            // works with direct value and prop params

        })
        describe.skip("working with normal query ->", () => {

            it("works with normal query, and identity, props, and active params", (done) => {

                let req = {
                    function_name: "i_f_0",
                    lang: "en",
                    site: "enwiki",
                    groups: [
                        {
                            identities: [1,1,0,0,0],
                            props: {
                                entity_ref: [
                                    {prop: 1711},
                                ],
                            },
                            save: true// the resulting table will be saved for later use
                            // a group tables is saved when it's prop query's explicitly stated in queries
                        },
                        {
                            identities: [1,1,0,0,0]
                        },
                    ],
                    queries: [
                        {
                            type: "id",
                            group: 0,
                            ids: [":pm0"],
                            save: true
                        },
                        {
                            type: "prop",
                            group: 0
                        },
                        {
                            active: ":pm1",
                            type: "recursive",
                            group: 1,

                            ids: [":gr0"],

                            upProps: [":pm2"],
                            downProps: null,

                            upDepth: ":pm3",
                            downDepth: 1,
                            cousinDepth: 1,
                        },
                    ],
                    paramTypes: [
                        "ids",
                        "bool",
                        "prop_ids",
                        "int"
                    ],
                }

                let resultFunction = `
                    CREATE FUNCTION i_f_0 (

                        pm0 BIGINT[],
                        pm1 BOOLEAN,
                        pm2 BIGINT[],
                        pm3 INTEGER
                    )
                    RETURNS SETOF data_set
                    AS $$
                    DECLARE
                	    ds data_set%ROWTYPE;
                	    row RECORD;
                        entity_id BIGINT;
                	    claims VARCHAR(127)[];

                        gr0 BIGINT[]=ARRAY[]::BIGINT[];
                        gr1 BIGINT[]=ARRAY[]::BIGINT[];

                    BEGIN

                        gr0 := pm0;

                        IF (ARRAY_LENGTH(gr0, 1) > 0)
                        THEN


                            -- Get selection entities

                    		CREATE TEMP TABLE temp AS (
                    		    SELECT *
                    		    FROM get_values(

                        			gr0,

                        			TRUE,
                        			TRUE,
                        			FALSE,
                        			FALSE,
                        			FALSE,

                        			'en',
                        			'enwiki',

                                    p_entity_ref_ids:=ARRAY[1711]::BIGINT[]
                    		    )
                    		);

                    		FOR ds IN
                    		    SELECT * FROM temp
                            LOOP RETURN NEXT ds; END LOOP;

                            -- collect selection's claim values and details to get other entities

                            entity_vals = '{}';
                        	FOR row IN SELECT spec1 FROM temp
                        		WHERE prop = ANY(ARRAY[1711]::BIGINT[])
                        	LOOP
                    		    entity_vals := ARRAY_APPEND (entity_vals, row.val);
                    		END LOOP;

                    		CREATE TEMP TABLE temp2 AS (
                    		    SELECT
                                    id,
                                    entity_id
                                FROM
                                    claims
                                INNER JOIN entity_ref
                                ON
                                    claims.id = entity_ref.claim_id
                                WHERE
                                    property_id = ANY(ARRAY[1711]::BIGINT[])
                                    AND
                                    value_id = entity_vals
                                LIMIT 100
                            )

                    		FOR ds IN
                    		    SELECT * FROM temp2
                                ds.type := g;
                                ds.subject := '1';
                                ds.val := entity_id;

                                ds.prop := null;
                                ds.spec1 := null;
                                ds.spec2 := null;
                                ds.rank := null;
                            RETURN NEXT ds; END LOOP;


                    		DROP TABLE temp;
                    		DROP TABLE temp2;
                        END IF;

                        IF (pm1) THEN

                            gr1 := ARRAY_CAT(gr1, get_connected_entities(
                                    gr0,
                                    pm2,
                                    p_up_depth:=:pm3,
                                    p_down_depth:=1,
                                    p_cousin_depth:=1
                                )
                            );
                            FOREACH entity_id IN ARRAY gr1
                            LOOP

                                ds.type := 'g';
                                ds.subject := '1';
                                ds.val := entity_id;

                                ds.prop := null;
                                ds.spec1 := null;
                                ds.spec2 := null;
                                ds.rank := null;

                            RETURN NEXT ds;
                            END LOOP;
                        END IF;

                        IF (ARRAY_LENGTH(gr1, 1) > 0)
                        THEN
                    		CREATE TEMP TABLE temp AS (
                    		    SELECT *
                    		    FROM get_values(

                        			gr1,

                        			TRUE,
                        			TRUE,
                        			FALSE,
                        			FALSE,
                        			FALSE,

                        			'en',
                        			'enwiki'
                    		    )
                    		);

                    		FOR ds IN
                    		    SELECT * FROM temp
                            LOOP RETURN NEXT ds; END LOOP;

                    		DROP TABLE temp;
                        END IF;

                        RETURN;

                    END; $$

                    LANGUAGE 'plpgsql';
                `;

                php.call(
                    "utils/sql_function_utils_caller",
                    "create_infographic_function",
                    req,
                    res => {
                        // simplifyString(resultFunction).should.equals(simplifyString(res));
                        // diff(resultFunction, res);
                        done();
                    }
                );
            })

        })
    })
})

/*
SELECT udf_dropfunction ('i_f_0');
CREATE FUNCTION i_f_0 (

SELECT *
FROM i_f_0 (
    pm0 := ARRAY[310, 620, 67400],
    pm1 := ARRAY[4276260],
    pm2 := TRUE,
    pm3 := TRUE,
    pm4 := ARRAY[311]

    --1400(lion), 23728240(elephantidae)
    --1711 (parent taxon)
    --4276260 (taxonomic rank) 62560(country)
);
*/
