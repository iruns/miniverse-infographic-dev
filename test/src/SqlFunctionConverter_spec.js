// testee
import * as sqlConverter from '../../src/SqlFunctionConverter';

// utils
import _ from 'lodash';
import {diffLines} from '../utils/General';

// chai
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from "sinon-chai";

chai.use(sinonChai);

/*
npm test -- --grep "SqlFunctionConverter"
*/

describe("SqlFunctionConverter", () => {

    describe("convertVars()", () => {

        it("converts the vars to sql declaration", () => {
            const params = {
                "p_selections": {
                    type: 'id_array',
                    val: [1,2],
                },
                "p_active": {
                    type: 'bool',
                    val: true,
                },

                "p_int": {
                    type: 'int',
                    val: 0,
                },
                "p_small_int": {
                    type: 'small_int',
                    val: 0,
                },
                "p_big_int": {
                    type: 'big_int',
                    val: 0,
                },


                "p_string": {
                    type: 'string255',
                },
                "p_stringarray": {
                    type: 'string255_array',
                },

                "p_globe_coords": {
                    type: 'globe_coords',
                    val: {long:10, lat: 20},
                },
                "p_globe_coords_array": {
                    type: 'globe_coords_array',
                    val: [{long:10, lat: 20},{long:30, lat: 40}],
                },

                "p_quantity": {
                    type: 'quantity',
                },
                "p_quantity_array": {
                    type: 'quantity_array',
                },
                "p_quantity_unit": {
                    type: 'string127',
                    val: '1',
                },
            }

            const expRes = `
                p_selections BIGINT[] = ARRAY[1,2]::BIGINT[],
                p_active BOOLEAN = true,

                p_int INT = 0,
                p_small_int SMALLINT = 0,
                p_big_int BIGINT = 0,


                p_string VARCHAR(255) = '',
                p_stringarray VARCHAR(255)[] = ARRAY[]::VARCHAR(255)[],

                p_globe_coords POINT = '(10,20)',
                p_globe_coords_array POINT[] = ARRAY['(10,20)','(30,40)']::POINT[],

                p_quantity NUMERIC = 0,
                p_quantity_array NUMERIC[] = ARRAY[]::NUMERIC[],
                p_quantity_unit VARCHAR(127) = '1'
            `
            const res = sqlConverter.convertVars(params, ',');

            expect(diffLines(expRes, res)).to.equal(false);
        });
    })

    describe("convertArray()", () => {

        it("works on filled props", () => {
            let propsArray = [[311, 211], "v_prop1", "v_prop2", [21]];

            const expRes = "v_prop1||v_prop2||ARRAY[311,211,21]::BIGINT[]";
            const res = sqlConverter.convertArray(propsArray);

            expect(diffLines(expRes, res)).to.equal(false);
        });

        it("works on empty props", () => {
            let propsArray = [];

            const expRes = "NULL";
            const res = sqlConverter.convertArray(propsArray);

            expect(diffLines(expRes, res)).to.equal(false);
        });
    })

    describe("convertSetQuery()", () => {

        describe("converting simple set query", () => {

            it("converts the query", () => {

                const query = {
                    type: 'set',

                    set: 'v0',
                    to: 's0'
                }

                const expRes = `
                    v0 = s0;
                `
                const res = sqlConverter.convertSetQuery(query);

                expect(diffLines(expRes, res)).to.equal(false);
            })
        })

        describe("converting set query with if", () => {

            it("converts the query", () => {

                const query = {
                    type: 'set',

                    if: 's1',
                    set: 'v0',
                    to: 's0'
                }

                const expRes = `
                    IF s1 THEN
                        v0 = s0;
                    END IF;
                `
                const res = sqlConverter.convertSetQuery(query);

                expect(diffLines(expRes, res)).to.equal(false);
            })
        })
    })

    describe("convertClaimQuery()", () => {

        it("converts >> claim query", () => {

            const query = {
                type: 'claim',

                group: 0,
                identities: {
                    label: true,
                    alias: 'p_get_alias',
                    description: false,
                    sitelink: false,
                    class: false,
                },
                props: {
                    datetime: ["v_start_time", "p_other_props"],
                    entity_ref: ["v_instance_of"]
                },
            }

            const expRes = `
                IF (ARRAY_LENGTH(g0, 1) > 0)
                THEN

                    g0 = exclude_ids(g0, sg0e);

                    IF (ARRAY_LENGTH(g0, 1) > 0)
                    THEN
                        FOR ds IN SELECT *
                            FROM get_values(
                                g0,
                                true,p_get_alias,false,false,false,
                                p_lang, p_site,
                                p_datetime_ids := v_start_time||p_other_props,
                                p_entity_ref_ids := v_instance_of
                            )
                        LOOP RETURN NEXT ds; END LOOP;
                    END IF;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({query:query});

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts >> claim query, saving the values", () => {

            const query = {
                type: 'claim',

                group: 0,
                props: {
                    datetime: ["v_start_time", "p_other_props"],
                    entity_ref: ["v_instance_of"]
                },

                subs: [
                    {
                        type: 'value_var',

                        prop: "v_instance_of",

                        vars: {
                            val: "v_selection_class",
                        }
                    },
                    {
                        type: 'value_var',

                        prop: "v_start_time",

                        vars: {
                            val: "v_selection_start_time",
                            val4: "v_selection_start_time_v4",
                        }
                    },
                ]
            }

            const vars = {
                "v_selection_start_time": {
                    type: "big_int_array"
                },
                "v_selection_start_time_v4": {
                    type: "id_array"
                },
                "v_selection_class": {
                    type: "id_array"
                },
            }

            const expRes = `
                IF (ARRAY_LENGTH(g0, 1) > 0)
                THEN

                    g0 = exclude_ids(g0, sg0e);

                    IF (ARRAY_LENGTH(g0, 1) > 0)
                    THEN

                        CREATE TEMP TABLE temp_table AS (
                            SELECT *
                            FROM get_values(
                                g0,
                                false,false,false,false,false,
                                p_lang, p_site,
                                p_datetime_ids := v_start_time||p_other_props,
                                p_entity_ref_ids := v_instance_of
                            )
                        );

                        FOR ds IN SELECT * FROM temp_table LOOP RETURN NEXT ds; END LOOP;


                        -- Query 1
                        FOR row IN
                        SELECT
                            val
                        FROM temp_table
                        WHERE
                            prop = ANY(v_instance_of)
                        LOOP
                            v_selection_class := ARRAY_APPEND (v_selection_class, row.val::BIGINT);
                        END LOOP;


                        -- Query 2
                        FOR row IN
                        SELECT
                            val, val4
                        FROM temp_table
                        WHERE
                            prop = ANY(v_start_time)
                        LOOP
                            v_selection_start_time    := ARRAY_APPEND (v_selection_start_time, row.val::BIGINT);
                            v_selection_start_time_v4 := ARRAY_APPEND (v_selection_start_time_v4, row.val4::BIGINT);
                        END LOOP;


                        DROP TABLE temp_table;

                    END IF;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({
                query: query,
                vars: vars
            });

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts >> qualifier", () => {

            const query = {
                type: "qualifier",

                prop: "v_instance_of",
                qualifiers: {
                    datetime: ["v_start_time"],
                },
            }

            const expRes = `
                -- get the claims first
                claims = '{}';
                FOR row IN SELECT spec1 FROM temp_table
                	WHERE prop = ANY(v_instance_of)
                LOOP
                    claims := ARRAY_APPEND (claims, row.spec1);
                END LOOP;

                -- then get the qualifiers
                IF (ARRAY_LENGTH(claims, 1) > 0)
                THEN

                    FOR ds IN
                	    SELECT * FROM get_qualifiers(
                			claims,
                			p_datetime_ids := v_start_time
                	    )
                	LOOP RETURN NEXT ds; END LOOP;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({query:query});

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("with qualifier, saving the values", () => {

            const query = {
                type: "qualifier",

                prop: "v_instance_of",
                qualifiers: {
                    datetime: ["v_start_time"],
                },

                subs: [
                    {
                        type: 'value_var',

                        prop: "v_start_time",

                        vars: {
                            val: "v_selection_class_start_time",
                            val4: "v_selection_class_start_time_v4",
                        },
                    },
                ]
            }

            const vars = {
                "v_selection_class_start_time": {
                    type: "big_int_array"
                },
                "v_selection_class_start_time_v4": {
                    type: "id_array"
                },
            }

            const expRes = `
                -- get the claims first
                claims = '{}';
                FOR row IN SELECT spec1 FROM temp_table
                	WHERE prop = ANY(v_instance_of)
                LOOP
                    claims := ARRAY_APPEND (claims, row.spec1);
                END LOOP;

                -- then get the qualifiers
                IF (ARRAY_LENGTH(claims, 1) > 0)
                    THEN

                    CREATE TEMP TABLE temp_table_sub AS (
                	    SELECT * FROM get_qualifiers(
                			claims,
                			p_datetime_ids := v_start_time
                	    )
                    );

                	FOR ds IN SELECT * FROM temp_table_sub LOOP RETURN NEXT ds; END LOOP;

                    -- then save them
                    FOR row IN
                    SELECT
                        val, val4
                    FROM temp_table_sub
                    WHERE
                        prop = ANY(v_start_time)
                    LOOP
                        v_selection_class_start_time    := ARRAY_APPEND (v_selection_class_start_time, row.val::BIGINT);
                        v_selection_class_start_time_v4 := ARRAY_APPEND (v_selection_class_start_time_v4, row.val4::BIGINT);
                    END LOOP;

                    DROP TABLE temp_table_sub;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({
                query: query,
                vars: vars
            });

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("reference only", () => {

            const query = {
                type: "reference",

                prop: "v_instance_of",
                references: {
                    datetime: ["v_start_time"],
                },
            }

            const expRes = `
                -- get the claims first
                claims = '{}';
            	FOR row IN SELECT spec1 FROM temp_table
            		WHERE prop = ANY(v_instance_of)
            	LOOP
        		    claims := ARRAY_APPEND (claims, row.spec1);
        		END LOOP;

                -- then get the references
                IF (ARRAY_LENGTH(claims, 1) > 0)
                    THEN

            		FOR ds IN
            		    SELECT * FROM get_references(
                			claims,
                			p_datetime_ids := v_start_time
            		    )
            		LOOP RETURN NEXT ds; END LOOP;
                END IF;
            `
            const res = sqlConverter.convertClaimQuery({query:query});

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("with claim, qualifier, saving the values", () => {

            const query = {
                type: 'claim',

                group: 0,
                props: {
                    entity_ref: ["v_instance_of"]
                },

                subs: [
                    {
                        type: "qualifier",

                        prop: "v_instance_of",
                        qualifiers: {
                            datetime: ["v_start_time"],
                        },

                        subs: [
                            {
                                type: 'value_var',

                                prop: "v_start_time",

                                vars: {
                                    val: "v_selection_class_start_time",
                                    val4: "v_selection_class_start_time_v4",
                                },
                            },
                        ]
                    },
                ]
            }

            const vars = {
                "v_selection_class_start_time": {
                    type: "big_int_array"
                },
                "v_selection_class_start_time_v4": {
                    type: "id_array"
                },
            }

            const expRes = `
                IF (ARRAY_LENGTH(g0, 1) > 0)
                THEN

                    g0 = exclude_ids(g0, sg0e);

                    IF (ARRAY_LENGTH(g0, 1) > 0)
                    THEN

                        CREATE TEMP TABLE temp_table AS (
                            SELECT *
                            FROM get_values(
                                g0,
                                false,false,false,false,false,
                                p_lang, p_site,
                                p_entity_ref_ids := v_instance_of
                            )
                        );

                    	FOR ds IN SELECT * FROM temp_table LOOP RETURN NEXT ds; END LOOP;

                        -- Qualifiers
                        -- get the claims first
                        claims = '{}';
                    	FOR row IN SELECT spec1 FROM temp_table
                    		WHERE prop = ANY(v_instance_of)
                    	LOOP
                		    claims := ARRAY_APPEND (claims, row.spec1);
                		END LOOP;

                        -- then get the qualifiers
                        IF (ARRAY_LENGTH(claims, 1) > 0)
                            THEN

                            CREATE TEMP TABLE temp_table_sub AS (
                    		    SELECT * FROM get_qualifiers(
                        			claims,
                        			p_datetime_ids := v_start_time
                    		    )
                            );

                        	FOR ds IN SELECT * FROM temp_table_sub LOOP RETURN NEXT ds; END LOOP;

                            -- then save them
                            FOR row IN
                            SELECT
                                val, val4
                            FROM temp_table_sub
                            WHERE
                                prop = ANY(v_start_time)
                            LOOP
                                v_selection_class_start_time    := ARRAY_APPEND (v_selection_class_start_time, row.val::BIGINT);
                                v_selection_class_start_time_v4 := ARRAY_APPEND (v_selection_class_start_time_v4, row.val4::BIGINT);
                            END LOOP;

                            DROP TABLE temp_table_sub;
                        END IF;

                        DROP TABLE temp_table;

                    END IF;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({
                query: query,
                vars: vars
            });

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts >> all with settings", () => {

            const query = {
                if: "s1",

                type: 'claim',
                save_vars: true,

                group: 0,
                props: {
                    datetime: ["p0"],
                },

                subs: [
                    {
                        type: 'value_var',

                        prop: "p0",

                        vars: {
                            val: "v_something",
                        }
                    },
                    {
                        if: "s2",

                        type: "qualifier",

                        prop: "p0",
                        qualifiers: {
                            datetime: ["p1"],
                        },

                        subs: [
                            {
                                type: 'value_var',

                                prop: "p1",

                                vars: {
                                    val: "v_something_2",
                                }
                            },
                        ]
                    },
                ]
            }

            const vars = {
                "v_something": {type: "id_array"},
                "v_something_2": {type: "id_array"},
            }

            const expRes = `
                IF s1
                THEN

                    IF (ARRAY_LENGTH(g0, 1) > 0)
                    THEN
                        g0 = exclude_ids(g0, sg0e);

                        IF (ARRAY_LENGTH(g0, 1) > 0)
                        THEN
                            CREATE TEMP TABLE temp_table AS (
                                SELECT *
                                FROM get_values(
                                    g0,false,false,false,false,false,p_lang,p_site,p_datetime_ids := p0
                                )
                            );
                            FOR ds IN SELECT * FROM temp_table LOOP RETURN NEXT ds;
                            END LOOP;

                            FOR row IN SELECT
                            val FROM temp_table
                            WHERE prop = ANY(p0) LOOP
                                v_something := ARRAY_APPEND (v_something, row.val::BIGINT);
                            END LOOP;

                            IF s2
                            THEN
                                claims = '{}';
                                FOR row IN SELECT spec1 FROM temp_table
                                WHERE prop = ANY(p0)
                                LOOP claims := ARRAY_APPEND (claims, row.spec1);
                                END LOOP;

                                IF (ARRAY_LENGTH(claims, 1) > 0)
                                THEN

                                    CREATE TEMP TABLE temp_table_sub AS (
                                        SELECT *
                                        FROM get_qualifiers(
                                            claims,p_datetime_ids := p1
                                        )
                                    );

                                    FOR ds IN SELECT * FROM temp_table_sub LOOP RETURN NEXT ds;
                                    END LOOP;

                                    FOR row IN SELECT
                                    val FROM temp_table_sub
                                    WHERE prop = ANY(p1) LOOP
                                        v_something_2 := ARRAY_APPEND (v_something_2, row.val::BIGINT);
                                    END LOOP;

                                    DROP TABLE temp_table_sub;
                                END IF;

                            END IF;

                            DROP TABLE temp_table;
                        END IF;
                    END IF;
                END IF;
            `;

            const res = sqlConverter.convertClaimQuery({
                query: query,
                vars: vars
            });
            // console.log(res);
            expect(diffLines(expRes, res)).to.equal(false);
        })

    })

    describe("convertClassFilterQuery()", () => {

        it("converts class filter query", () => {

            const query = {
                type: 'class_filter',

                group: 1,
                class: ["v_taxonomy_class", "v_country_class"],
                limit: 50
            }

            const expRes = `
                -- get the instances of a class to a group
                g1 := ARRAY_CAT(
                    g1,get_instances_of(
                        v_taxonomy_class||v_country_class,
                        50::SMALLINT
                    )
                );

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g1
                LOOP
                    ds.type := 'g';
                    ds.subject := 1;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertClassFilterQuery(query, ',');

            expect(diffLines(expRes, res)).to.equal(false);
        })

    })

    describe("convertConnectedToFilterQuery()", () => {

        it("converts recursive filter query", () => {

            const query = {
                type: 'connected_to_filter',

                group: 2,

                entities: ["v_selection", "v_landmark"],

                up_props: ["v_up_prop1","v_up_prop2"],
                down_props: ["v_down_prop"],

                up_depth: "v_up_depth",
                down_depth: 1,
                cousin_depth: 1,

                limit: 50
            }

            const expRes = `
                -- get the connected entities
                g2 := ARRAY_CAT(
                    g2, get_connected_entities(
                        v_selection||v_landmark,
                        v_up_prop1||v_up_prop2,
                        v_down_prop,
                        p_up_depth := v_up_depth::SMALLINT,
                        p_down_depth := 1::SMALLINT,
                        p_cousin_depth := 1::SMALLINT,
                        p_limit := 50::SMALLINT
                    )
                );

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g2
                LOOP
                    ds.type := 'g';
                    ds.subject := 2;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertConnectedToFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

    })

    describe("convertPropsFilterQuery()", () => {

        it("converts props query with exact values", () => {

            const query = {
                type: 'props_filter',

                group: 3,

                subs: [
                    {
                        table: "entity_ref",
                        prop: "p0",

                        exacts:{
                            value: ["v_battle"]
                        }
                    },
                    {
                        table: "entity_ref",
                        prop: "p1",

                        exacts:{
                            value: ["v_countries"]
                        }
                    },
                ],
                limit: 20
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p0.entity_id

            	FROM claims as c_p0

            	INNER JOIN entity_ref as v_p0
            	ON
            		v_p0.claim_id = 'c:' || c_p0.id

            	INNER JOIN claims as c_p1
            	ON
            		c_p1.entity_id = c_p0.entity_id

            	INNER JOIN entity_ref as v_p1
            	ON
            		v_p1.claim_id = 'c:' || c_p1.id

            	WHERE

            		c_p0.property_id = ANY (p0)
            		AND
            		v_p0.value = ANY (v_battle)
            		AND
            		c_p1.property_id = ANY (p1)
            		AND
            		v_p1.value = ANY (v_countries)

            	LIMIT 20

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts props query with range around points", () => {

            const query = {
                type: 'props_filter',

                group: 3,
                limit: 20,

                subs: [
                    {
                        table: "quantity",
                        prop: "p0",

                        exacts:{
                            unit: ["v_unit"],// NOTE if there are multiple units, this will get them all
                        },
                        ranges:{
                            amount:{
                                points: ["v_n_casualties"],

                                lower_range: 2,
                                upper_range: "v_upper_range",
                            },
                        }
                    },
                ],
                limit: 20
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p0.entity_id

            	FROM claims as c_p0

            	INNER JOIN quantity as v_p0
            	ON
            		v_p0.claim_id = 'c:' || c_p0.id


            	WHERE

            		c_p0.property_id = ANY (p0)
            		AND
            		v_p0.unit = ANY (v_unit)
            		AND
            		v_p0.amount
                        BETWEEN min_n(v_n_casualties) - 2
                        AND max_n(v_n_casualties) + v_upper_range


            	LIMIT 20

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts props query with datetime", () => {

            const query = {
                type: 'props_filter',

                group: 3,
                limit: 20,

                subs: [
                    {
                        table: "datetime",
                        prop: "p1",

                        exacts:{
                            calendar_model_id: ["v_calendar_model"],
                        },
                        ranges: {
                            datetime:{
                                points: ["v_start_time_day"],

                                lower_range: "v_start_time_lower_range_days",
                                upper_range: 0
                            },
                        }
                    },
                ],
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p1.entity_id

            	FROM claims as c_p1

            	INNER JOIN datetime as v_p1
            	ON
            		v_p1.claim_id = 'c:' || c_p1.id

            	WHERE
            		c_p1.property_id = ANY (p1)
            		AND
            		v_p1.calendar_model_id = ANY (v_calendar_model)
                    AND
            		(v_p1.datetime::DATE - date '0001-1-1') - (v_p1.bce_years * 365.2422)::INT
                        BETWEEN min_n(v_start_time_day) - v_start_time_lower_range_days
                        AND max_n(v_start_time_day) + 0

            	LIMIT 20

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts props query with qualifier", () => {

            const query = {
                type: 'props_filter',

                group: 3,
                limit: 20,

                subs: [
                    {
                        table: "entity_ref",
                        prop: "p2",

                        exacts:{
                            value: ["v_country"]
                        },

                        subs:[
                            {
                                detail_table: "claim_qualifiers",
                                claim_prefix: "e",

                                table: "entity_ref",
                                prop: "p0",

                                exacts:{
                                    value: ["v_country_type"]
                                },
                            },
                            {
                                detail_table: "claim_qualifiers",
                                claim_prefix: "e",

                                table: "datetime",
                                prop: "p1",

                                exacts:{
                                    calendar_model_id: ["v_calendar_model"],
                                },

                                ranges:{
                                    datetime:{
                                        points: ["v_start_time_datetime"],

                                        lower_range: "v_start_time_lower_range_days",
                                        upper_range: 0,
                                    },
                                }
                            }
                        ]
                    },
                ],
                limit: 20
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p2.entity_id

            	FROM claims as c_p2

            	INNER JOIN entity_ref as v_p2
            	ON
            		v_p2.claim_id = 'c:' || c_p2.id

                -- qualifiers
                --      type
            	INNER JOIN claim_qualifiers as c_p2_q_e_p0
            	ON
            		c_p2_q_e_p0.claim_id = 'c:' || v_p2.claim_id

            	INNER JOIN entity_ref as v_p2_q_e_p0
            	ON
            		SUBSTRING(v_p2_q_e_p0.claim_id FROM 'e.*:(.*)') = c_p2_q_e_p0.claim_id

                --      start time
            	INNER JOIN claim_qualifiers as c_p2_q_e_p1
            	ON
            		c_p2_q_e_p1.claim_id = 'c:' || v_p2.claim_id

            	INNER JOIN datetime as v_p2_q_e_p1
            	ON
            		SUBSTRING(v_p2_q_e_p1.claim_id FROM 'e.*:(.*)') = c_p2_q_e_p1.claim_id


            	WHERE

            		c_p2.property_id = ANY (p2)
            		AND
            		v_p2.value = ANY (v_country)

            		AND
            		c_p2_q_e_p0.property_id = ANY (p0)
            		AND
            		v_p2_q_e_p0.value = ANY (v_country_type)

            		AND
            		c_p2_q_e_p1.property_id = ANY (p1)
            		AND
            		v_p2_q_e_p1.calendar_model_id = ANY (v_calendar_model)
                    AND
            		(v_p2_q_e_p1.datetime::DATE - date '0001-1-1') - (v_p2_q_e_p1.bce_years * 365.2422)::INT
                        BETWEEN min_n(v_start_time_datetime) - v_start_time_lower_range_days
                        AND max_n(v_start_time_datetime) + 0


            	LIMIT 20

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts props query with reference", () => {

            const query = {
                type: 'props_filter',

                group: 3,
                limit: 20,

                subs: [
                    {
                        table: "entity_ref",
                        prop: "p0",

                        exacts:{
                            value: ["v_country"]
                        },

                        subs:[
                            {
                                detail_table: "claim_references",
                                claim_prefix: "r",

                                table: "entity_ref",
                                prop: "p1",

                                exacts:{
                                    value: ["v_country_type"]
                                },
                            },
                            {
                                detail_table: "claim_references",
                                claim_prefix: "r",

                                table: "datetime",
                                prop: "p2",

                                exacts:{
                                    calendar_model_id: ["v_calendar_model"],
                                },

                                ranges:{
                                    datetime:{
                                        type: "datetime",

                                        points: ["v_start_time_datetime"],

                                        lower_range: "v_start_time_lower_range_days",
                                        upper_range: 0,
                                    },
                                }
                            }
                        ]
                    },
                ],
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p0.entity_id

            	FROM claims as c_p0

            	INNER JOIN entity_ref as v_p0
            	ON
            		v_p0.claim_id = 'c:' || c_p0.id

                -- references
                --      type
            	INNER JOIN claim_references as c_p0_r_p1
            	ON
            		c_p0_r_p1.claim_id = 'c:' || v_p0.claim_id

            	INNER JOIN entity_ref as v_p0_r_p1
            	ON
            		SUBSTRING(v_p0_r_p1.claim_id FROM 'r.*:(.*)') = c_p0_r_p1.claim_id

                --      start time
            	INNER JOIN claim_references as c_p0_r_p2
            	ON
            		c_p0_r_p2.claim_id = 'c:' || v_p0.claim_id

            	INNER JOIN datetime as v_p0_r_p2
            	ON
            		SUBSTRING(v_p0_r_p2.claim_id FROM 'r.*:(.*)') = c_p0_r_p2.claim_id


            	WHERE

            		c_p0.property_id = ANY (p0)
            		AND
            		v_p0.value = ANY (v_country)

            		AND
            		c_p0_r_p1.property_id = ANY (p1)
            		AND
            		v_p0_r_p1.value = ANY (v_country_type)

            		AND
            		c_p0_r_p2.property_id = ANY (p2)
            		AND
            		v_p0_r_p2.calendar_model_id = ANY (v_calendar_model)
                    AND
            		(v_p0_r_p2.datetime::DATE - date '0001-1-1') - (v_p0_r_p2.bce_years * 365.2422)::INT
                        BETWEEN min_n(v_start_time_datetime) - v_start_time_lower_range_days
                        AND max_n(v_start_time_datetime) + 0

            	LIMIT 20

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

        it("converts props query with if, order_by, limit, and offset settings", () => {

            const query = {
                type: 'props_filter',

                group: 3,
                limit: 20,
                offset: 10,

                orderings: [
                    { order_by: "p0", order: "DESC"},
                    { order_by: "p0_r_p1", order: "ASC"},
                ],

                subs: [
                    {
                        if: "s_get_countries",

                        table: "entity_ref",
                        prop: "p0",

                        exacts:{
                            value: ["v_country"]
                        },

                        subs:[
                            {
                                detail_table: "claim_references",
                                claim_prefix: "r",

                                table: "entity_ref",
                                prop: "p1",

                                exacts:{
                                    value: ["v_country_type"]
                                },
                            },
                            {
                                detail_table: "claim_references",
                                claim_prefix: "r",

                                table: "datetime",
                                prop: "p2",

                                exacts:{
                                    calendar_model_id: ["v_calendar_model"],
                                },

                                ranges:{
                                    datetime:{
                                        type: "datetime",

                                        points: ["v_start_time_datetime"],

                                        lower_range: "v_start_time_lower_range_days",
                                        upper_range: 0,
                                    },
                                }
                            }
                        ]
                    },
                ],
            }

            const expRes = `
                -- get the entities based on prop values
            	FOR row IN
            	SELECT DISTINCT ON (entity_id)
            		c_p0.entity_id

            	FROM claims as c_p0

            	INNER JOIN entity_ref as v_p0
            	ON
            		v_p0.claim_id = 'c:' || c_p0.id

                -- references
                --      type
            	INNER JOIN claim_references as c_p0_r_p1
            	ON
            		c_p0_r_p1.claim_id = 'c:' || v_p0.claim_id

            	INNER JOIN entity_ref as v_p0_r_p1
            	ON
            		SUBSTRING(v_p0_r_p1.claim_id FROM 'r.*:(.*)') = c_p0_r_p1.claim_id

                --      start time
            	INNER JOIN claim_references as c_p0_r_p2
            	ON
            		c_p0_r_p2.claim_id = 'c:' || v_p0.claim_id

            	INNER JOIN datetime as v_p0_r_p2
            	ON
            		SUBSTRING(v_p0_r_p2.claim_id FROM 'r.*:(.*)') = c_p0_r_p2.claim_id


            	WHERE

                    s_get_countries IS FALSE OR (
                		c_p0.property_id = ANY (p0)
                		AND
                		v_p0.value = ANY (v_country)
                    )

            		AND
            		c_p0_r_p1.property_id = ANY (p1)
            		AND
            		v_p0_r_p1.value = ANY (v_country_type)

            		AND
            		c_p0_r_p2.property_id = ANY (p2)
            		AND
            		v_p0_r_p2.calendar_model_id = ANY (v_calendar_model)
                    AND
            		(v_p0_r_p2.datetime::DATE - date '0001-1-1') - (v_p0_r_p2.bce_years * 365.2422)::INT
                        BETWEEN min_n(v_start_time_datetime) - v_start_time_lower_range_days
                        AND max_n(v_start_time_datetime) + 0

            	LIMIT 20
            	OFFSET 10

                ORDER BY
                    p0.v DESC,
                    p0_r_p1.v ASC;

            	LOOP
            	    g3 := ARRAY_APPEND (g3, row.entity_id);
            	END LOOP;

                -- then add to the final dataSet
                FOREACH e_id IN ARRAY g3
                LOOP
                    ds.type := 'g';
                    ds.subject := 3;
                    ds.val := e_id;
                    ds.prop := 0;
                    ds.spec1 := '';
                    ds.spec2 := '';
                    ds.rank := 0;
                RETURN NEXT ds;
                END LOOP;
            `
            const res = sqlConverter.convertPropsFilterQuery(query);

            expect(diffLines(expRes, res)).to.equal(false);
        })

    })

    describe("createFunction()", () => {

        it("works with complex function", () => {

            const config = {
                "hash": "i_f_0",
                "params": {
                    "s0": {
                        "type": "id_array"
                    },
                    "s1": {
                        "type": "bool"
                    },
                    "s2": {
                        "type": "bool"
                    },
                    "s3": {
                        "type": "bool"
                    },
                    "s4": {
                        "type": "bool"
                    },
                    "s5": {
                        "type": "bool"
                    },
                    "s6": {
                        "type": "bool"
                    },
                    "s7": {
                        "type": "big_int"
                    },
                    "s8": {
                        "type": "big_int"
                    },
                    "sg0e": {
                        "type": "id_array"
                    },
                    "sg1e": {
                        "type": "id_array"
                    },
                    "sg2e": {
                        "type": "id_array"
                    }
                },
                "vars": {
                    "fv0": {
                        "type": "small_int",
                        "val": 1
                    },
                    "p0": {
                        "type": "id_array"
                    },
                    "p1": {
                        "type": "id_array"
                    },
                    "p2": {
                        "type": "id_array"
                    },
                    "p3": {
                        "type": "id_array"
                    },
                    "p4": {
                        "type": "id_array"
                    },
                    "p5": {
                        "type": "id_array"
                    },
                    "p6": {
                        "type": "id_array"
                    },
                    "p7": {
                        "type": "id_array"
                    },
                    "p8": {
                        "type": "id_array"
                    },
                    "p9": {
                        "type": "id_array"
                    },
                    "p10": {
                        "type": "id_array"
                    },
                    "p11": {
                        "type": "id_array"
                    },
                    "p12": {
                        "type": "id_array"
                    },
                    "p13": {
                        "type": "id_array"
                    },
                    "p14": {
                        "type": "id_array"
                    },
                    "p15": {
                        "type": "id_array"
                    },
                    "p16": {
                        "type": "id_array"
                    },
                    "p17": {
                        "type": "id_array"
                    },
                    "g0": {
                        "type": "id_array"
                    },
                    "g1": {
                        "type": "id_array"
                    },
                    "vg1_p11_a": {
                        "type": "id_array"
                    },
                    "g2": {
                        "type": "id_array"
                    },
                    "g0_p3_v": {
                        "type": "id_array"
                    },
                    "g0_p4_v": {
                        "type": "id_array"
                    }
                },
                "queries": [
                    {
                        "type": "set",
                        "set": "p0",
                        "to": [
                            [
                                3611
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p1",
                        "to": [
                            [
                                1791
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p2",
                        "to": [
                            [
                                7101
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p3",
                        "to": [
                            [
                                2761
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p4",
                        "to": [
                            [
                                171
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p5",
                        "to": [
                            [
                                8281
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p6",
                        "to": [
                            [
                                14521
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p7",
                        "to": [
                            [
                                14781
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p8",
                        "to": [
                            [
                                15361
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p9",
                        "to": [
                            [
                                1551
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p10",
                        "to": [
                            [
                                1561
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p11",
                        "to": [
                            [
                                181
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p12",
                        "to": [
                            [
                                411
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p13",
                        "to": [
                            [
                                11201
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p14",
                        "to": [
                            [
                                6251
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p15",
                        "to": [
                            [
                                5851
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p16",
                        "to": [
                            [
                                5801
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p17",
                        "to": [
                            [
                                5821
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "g0",
                        "to": [
                            "s0"
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 0,
                        "identities": {
                            "label": true,
                            "alias": true,
                            "description": true,
                            "sitelink": true,
                            "class": true
                        },
                        "props": {
                            "entity_ref": [
                                "p0",
                                "p1",
                                "p2",
                                "p3",
                                "p4",
                                "p5",
                                "p6",
                                "p7",
                                "p8",
                                "p9",
                                "p10"
                            ],
                            "string": [
                                "p11"
                            ],
                            "quantity": [
                                "p13"
                            ],
                            "globe_coords": [
                                "p14"
                            ],
                            "datetime": [
                                "p15",
                                "p16",
                                "p17"
                            ]
                        },
                        "subs": [
                            {
                                "type": "value_var",
                                "prop": "p3",
                                "vars": {
                                    "val": "g0_p3_v"
                                }
                            },
                            {
                                "type": "value_var",
                                "prop": "p4",
                                "vars": {
                                    "val": "g0_p4_v"
                                }
                            }
                        ]
                    },
                    {
                        "limit": 50,
                        "group": 1,
                        "type": "connected_to_filter",
                        "entities": [
                            "g0"
                        ],
                        "up_props": [
                            "p0"
                        ],
                        "down_props": [
                            "p1"
                        ],
                        "up_depth": "fv0",
                        "down_depth": "fv0",
                        "cousin_depth": "fv0"
                    },
                    {
                        "type": "set",
                        "if": "s6",
                        "set": "vg1_p11_a",
                        "to": "p11"
                    },
                    {
                        "type": "claim",
                        "group": 1,
                        "identities": {
                            "label": true,
                            "alias": "s4",
                            "description": "s5",
                            "sitelink": true,
                            "class": true
                        },
                        "props": {
                            "entity_ref": [
                                "p0",
                                "p1",
                                "p2",
                                "p3",
                                "p4"
                            ],
                            "string": [
                                "vg1_p11_a"
                            ],
                            "quantity": [
                                "p13"
                            ],
                            "globe_coords": [
                                "p14"
                            ],
                            "datetime": [
                                "p15",
                                "p16",
                                "p17"
                            ]
                        },
                        "if": "s1"
                    },
                    {
                        "type": "set",
                        "set": "g2",
                        "to": [
                            "g0_p3",
                            "g0_p4"
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 2,
                        "identities": {
                            "label": true,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {
                            "entity_ref": [
                                "p12"
                            ],
                            "globe_coords": [
                                "p14"
                            ]
                        }
                    }
                ],
            }

            const sqlFunction = sqlConverter.createFunction(config, ',');

            const expRes = `CREATE FUNCTION i_f_0 (
                    p_lang labels.language%TYPE = 'en',
                    p_site sitelinks.site%TYPE = 'enwiki',
                    s0 BIGINT[] = ARRAY[]::BIGINT[],
                    s1 BOOLEAN = FALSE,
                    s2 BOOLEAN = FALSE,
                    s3 BOOLEAN = FALSE,
                    s4 BOOLEAN = FALSE,
                    s5 BOOLEAN = FALSE,
                    s6 BOOLEAN = FALSE,
                    s7 BIGINT = 0,
                    s8 BIGINT = 0,
                    sg0e BIGINT[] = ARRAY[]::BIGINT[],
                    sg1e BIGINT[] = ARRAY[]::BIGINT[],
                    sg2e BIGINT[] = ARRAY[]::BIGINT[]
                )

                RETURNS SETOF data_set AS $$

                DECLARE
                    ds data_set%ROWTYPE;
                    row RECORD;
                    e_id BIGINT;
                    claims VARCHAR(127)[];
                    fv0 SMALLINT = 1;
                    p0 BIGINT[] = ARRAY[]::BIGINT[];
                    p1 BIGINT[] = ARRAY[]::BIGINT[];
                    p2 BIGINT[] = ARRAY[]::BIGINT[];
                    p3 BIGINT[] = ARRAY[]::BIGINT[];
                    p4 BIGINT[] = ARRAY[]::BIGINT[];
                    p5 BIGINT[] = ARRAY[]::BIGINT[];
                    p6 BIGINT[] = ARRAY[]::BIGINT[];
                    p7 BIGINT[] = ARRAY[]::BIGINT[];
                    p8 BIGINT[] = ARRAY[]::BIGINT[];
                    p9 BIGINT[] = ARRAY[]::BIGINT[];
                    p10 BIGINT[] = ARRAY[]::BIGINT[];
                    p11 BIGINT[] = ARRAY[]::BIGINT[];
                    p12 BIGINT[] = ARRAY[]::BIGINT[];
                    p13 BIGINT[] = ARRAY[]::BIGINT[];
                    p14 BIGINT[] = ARRAY[]::BIGINT[];
                    p15 BIGINT[] = ARRAY[]::BIGINT[];
                    p16 BIGINT[] = ARRAY[]::BIGINT[];
                    p17 BIGINT[] = ARRAY[]::BIGINT[];
                    g0 BIGINT[] = ARRAY[]::BIGINT[];
                    g1 BIGINT[] = ARRAY[]::BIGINT[];
                    vg1_p11_a BIGINT[] = ARRAY[]::BIGINT[];
                    g2 BIGINT[] = ARRAY[]::BIGINT[];
                    g0_p3_v BIGINT[] = ARRAY[]::BIGINT[];
                    g0_p4_v BIGINT[] = ARRAY[]::BIGINT[];

                BEGIN

                    p0 = ARRAY[3611];

                    p1 = ARRAY[1791];

                    p2 = ARRAY[7101];

                    p3 = ARRAY[2761];

                    p4 = ARRAY[171];

                    p5 = ARRAY[8281];

                    p6 = ARRAY[14521];

                    p7 = ARRAY[14781];

                    p8 = ARRAY[15361];

                    p9 = ARRAY[1551];

                    p10 = ARRAY[1561];

                    p11 = ARRAY[181];

                    p12 = ARRAY[411];

                    p13 = ARRAY[11201];

                    p14 = ARRAY[6251];

                    p15 = ARRAY[5851];

                    p16 = ARRAY[5801];

                    p17 = ARRAY[5821];

                    g0 = s0;

                    IF (ARRAY_LENGTH(g0, 1) > 0)
                    THEN
                        g0 = exclude_ids(g0, sg0e);

                        IF (ARRAY_LENGTH(g0, 1) > 0)
                        THEN
                            CREATE TEMP TABLE temp_table AS (
                                SELECT *
                                FROM get_values (
                                    g0,true,true,true,true,true,p_lang,p_site,
                                    p_entity_ref_ids := p0||p1||p2||p3||p4||p5||p6||p7||p8||p9||p10,
                                    p_string_ids := p11,
                                    p_quantity_ids := p13,
                                    p_globe_coords_ids := p14,
                                    p_datetime_ids := p15||p16||p17
                                )
                            );

                            FOR ds IN
                                SELECT *
                                FROM temp_table
                            LOOP RETURN NEXT ds;
                            END LOOP;

                            FOR row IN
                                SELECT val
                                FROM temp_table
                                WHERE prop = ANY(p3)
                            LOOP
                                g0_p3_v := ARRAY_APPEND (g0_p3_v,row.val::BIGINT);
                            END LOOP;

                            FOR row IN
                                SELECT val
                                FROM temp_table
                                WHERE prop = ANY(p4)
                            LOOP
                                g0_p4_v := ARRAY_APPEND (g0_p4_v,row.val::BIGINT);
                            END LOOP;

                            DROP TABLE temp_table;
                        END IF;

                    END IF;


                    g1 := ARRAY_CAT(
                        g1,get_connected_entities(
                            g0,
                            p0,
                            p1,
                            p_up_depth := fv0::SMALLINT,
                            p_down_depth := fv0::SMALLINT,
                            p_cousin_depth := fv0::SMALLINT,
                            p_limit := 50::SMALLINT
                        )
                    );
                    FOREACH e_id IN ARRAY g1
                    LOOP
                        ds.type := 'g';
                        ds.subject := 1;
                        ds.val := e_id;
                        ds.prop := 0;
                        ds.spec1 := '';
                        ds.spec2 := '';
                        ds.rank := 0;
                    RETURN NEXT ds;
                    END LOOP;


                    IF s6 THEN
                        vg1_p11_a = p11;
                    END IF;


                    IF s1
                    THEN
                        IF (ARRAY_LENGTH(g1, 1) > 0)
                        THEN
                            g1 = exclude_ids(g1, sg1e);

                            IF (ARRAY_LENGTH(g1, 1) > 0)
                            THEN
                                FOR ds IN
                                    SELECT *
                                    FROM get_values (
                                        g1,true,s4,s5,true,true,p_lang,p_site,
                                        p_entity_ref_ids := p0||p1||p2||p3||p4,
                                        p_string_ids := vg1_p11_a,
                                        p_quantity_ids := p13,
                                        p_globe_coords_ids := p14,
                                        p_datetime_ids := p15||p16||p17
                                    )
                                LOOP RETURN NEXT ds;
                                END LOOP;

                            END IF;

                        END IF;

                    END IF;


                    g2 = g0_p3||g0_p4;

                    IF (ARRAY_LENGTH(g2, 1) > 0)
                    THEN
                        g2 = exclude_ids(g2, sg2e);

                        IF (ARRAY_LENGTH(g2, 1) > 0)
                        THEN
                            FOR ds IN
                                SELECT *
                                FROM get_values (
                                    g2,true,false,false,false,false,p_lang,p_site,
                                    p_entity_ref_ids := p12,
                                    p_globe_coords_ids := p14
                                )
                            LOOP RETURN NEXT ds;
                            END LOOP;

                        END IF;

                    END IF;


                RETURN;END;$$ LANGUAGE 'plpgsql';`;

            expect(diffLines(expRes, sqlFunction)).to.equal(false);
        })

        describe("creating actual function", () => {

            it("taxonomy", () => {

                const config = {
                    "params": {
                        "s0": {
                            "type": "id_array"
                        },
                        "s1": {
                            "type": "bool"
                        },
                        "s2": {
                            "type": "bool"
                        },
                        "s3": {
                            "type": "bool"
                        },
                        "s4": {
                            "type": "bool"
                        },
                        "s5": {
                            "type": "small_int"
                        },
                        "s6": {
                            "type": "small_int"
                        },
                        "sg0e": {
                            "type": "id_array"
                        },
                        "sg1e": {
                            "type": "id_array"
                        }
                    },
                    "vars": {
                        "fv0": {
                            "type": "small_int",
                            "val": 1
                        },
                        "p0": {
                            "type": "id_array"
                        },
                        "p1": {
                            "type": "id_array"
                        },
                        "p2": {
                            "type": "id_array"
                        },
                        "p3": {
                            "type": "id_array"
                        },
                        "p4": {
                            "type": "id_array"
                        },
                        "g0": {
                            "type": "id_array"
                        },
                        "vg0_p2_a": {
                            "type": "id_array"
                        },
                        "g1": {
                            "type": "id_array"
                        },
                        "vg1_p2_a": {
                            "type": "id_array"
                        },
                        "vg1_p3_a": {
                            "type": "id_array"
                        }
                    },
                    "queries": [
                        {
                            "type": "set",
                            "set": "p0",
                            "to": [
                                [
                                    1711
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p1",
                            "to": [
                                [
                                    1051
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p2",
                            "to": [
                                [
                                    181
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p3",
                            "to": [
                                [
                                    1411
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p4",
                            "to": [
                                [
                                    2251
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "g0",
                            "to": [
                                "s0"
                            ]
                        },
                        {
                            "type": "set",
                            "if": "s1",
                            "set": "vg0_p2_a",
                            "to": "p2"
                        },
                        {
                            "type": "claim",
                            "group": 0,
                            "identities": {
                                "label": true,
                                "alias": "s1",
                                "description": true,
                                "sitelink": true,
                                "class": false
                            },
                            "props": {
                                "entity_ref": [
                                    "p0",
                                    "p1",
                                    "p3"
                                ],
                                "string": [
                                    "vg0_p2_a",
                                    "p4"
                                ]
                            },
                            "subs": []
                        },
                        {
                            "limit": 50,
                            "group": 1,
                            "type": "connected_to_filter",
                            "entities": [
                                "g0"
                            ],
                            "up_props": [
                                "p0"
                            ],
                            "down_props": [],
                            "up_depth": "s5",
                            "down_depth": "s6",
                            "cousin_depth": "fv0"
                        },
                        {
                            "type": "set",
                            "if": "s3",
                            "set": "vg1_p2_a",
                            "to": "p2"
                        },
                        {
                            "type": "set",
                            "if": "s4",
                            "set": "vg1_p3_a",
                            "to": "p3"
                        },
                        {
                            "type": "claim",
                            "group": 1,
                            "identities": {
                                "label": true,
                                "alias": "s1",
                                "description": "s2",
                                "sitelink": true,
                                "class": false
                            },
                            "props": {
                                "entity_ref": [
                                    "p0",
                                    "p1",
                                    "vg1_p3_a"
                                ],
                                "string": [
                                    "vg1_p2_a",
                                    "p4"
                                ]
                            }
                        }
                    ],
                    "hash": "i_f_0"
                }

                const sqlFunction = sqlConverter.createFunction(config, ',');

                const expRes = `CREATE FUNCTION i_f_0 (
                        p_lang labels.language%TYPE = 'en',
                        p_site sitelinks.site%TYPE = 'enwiki',
                        s0 BIGINT[] = ARRAY[]::BIGINT[],
                        s1 BOOLEAN = FALSE,
                        s2 BOOLEAN = FALSE,
                        s3 BOOLEAN = FALSE,
                        s4 BOOLEAN = FALSE,
                        s5 SMALLINT = 0,
                        s6 SMALLINT = 0,
                        sg0e BIGINT[] = ARRAY[]::BIGINT[],
                        sg1e BIGINT[] = ARRAY[]::BIGINT[]
                    )

                    RETURNS SETOF data_set AS $$

                    DECLARE
                        ds data_set%ROWTYPE;
                        row RECORD;
                        e_id BIGINT;
                        claims VARCHAR(127)[];
                        fv0 SMALLINT = 1;
                        p0 BIGINT[] = ARRAY[]::BIGINT[];
                        p1 BIGINT[] = ARRAY[]::BIGINT[];
                        p2 BIGINT[] = ARRAY[]::BIGINT[];
                        p3 BIGINT[] = ARRAY[]::BIGINT[];
                        p4 BIGINT[] = ARRAY[]::BIGINT[];
                        g0 BIGINT[] = ARRAY[]::BIGINT[];
                        vg0_p2_a BIGINT[] = ARRAY[]::BIGINT[];
                        g1 BIGINT[] = ARRAY[]::BIGINT[];
                        vg1_p2_a BIGINT[] = ARRAY[]::BIGINT[];
                        vg1_p3_a BIGINT[] = ARRAY[]::BIGINT[];

                    BEGIN

                        p0 = ARRAY[1711];

                        p1 = ARRAY[1051];

                        p2 = ARRAY[181];

                        p3 = ARRAY[1411];

                        p4 = ARRAY[2251];

                        g0 = s0;

                       IF s1 THEN
                            vg0_p2_a = p2;
                       END IF;


                        IF (ARRAY_LENGTH(g0, 1) > 0)
                        THEN
                            g0 = exclude_ids(g0, sg0e);

                            IF (ARRAY_LENGTH(g0, 1) > 0)
                            THEN
                                CREATE TEMP TABLE temp_table AS (
                                    SELECT *
                                    FROM get_values (
                                        g0,true,s1,true,true,false,p_lang,p_site,p_entity_ref_ids := p0||p1||p3,p_string_ids := vg0_p2_a||p4
                                    )
                                );

                                FOR ds IN
                                    SELECT *
                                    FROM temp_table
                                LOOP RETURN NEXT ds;
                                END LOOP;

                                DROP TABLE temp_table;
                            END IF;

                        END IF;


                        g1 := ARRAY_CAT(
                            g1,get_connected_entities(
                                g0,
                                p0,
                                p_up_depth := s5::SMALLINT,
                                p_down_depth := s6::SMALLINT,
                                p_cousin_depth := fv0::SMALLINT,
                                p_limit := 50::SMALLINT
                            )
                        );
                        FOREACH e_id IN ARRAY g1
                        LOOP
                            ds.type := 'g';
                            ds.subject := 1;
                            ds.val := e_id;
                            ds.prop := 0;
                            ds.spec1 := '';
                            ds.spec2 := '';
                            ds.rank := 0;
                        RETURN NEXT ds;
                        END LOOP;


                       IF s3 THEN
                            vg1_p2_a = p2;
                       END IF;


                       IF s4 THEN
                            vg1_p3_a = p3;
                       END IF;


                        IF (ARRAY_LENGTH(g1, 1) > 0)
                        THEN
                            g1 = exclude_ids(g1, sg1e);

                            IF (ARRAY_LENGTH(g1, 1) > 0)
                            THEN
                                FOR ds IN
                                    SELECT *
                                    FROM get_values (
                                        g1,true,s1,s2,true,false,p_lang,p_site,p_entity_ref_ids := p0||p1||vg1_p3_a,p_string_ids := vg1_p2_a||p4
                                    )
                                LOOP RETURN NEXT ds;
                                END LOOP;

                            END IF;

                        END IF;


                    RETURN;END;$$ LANGUAGE 'plpgsql';`;

                expect(diffLines(expRes, sqlFunction)).to.equal(false);

                /* test call
                SELECT * FROM i_f_0 (
                	p_lang := 'en',
                	p_site := 'enwiki',
                	s0 := ARRAY[1400]::BIGINT[],
                	s1 := TRUE,
                	s2 := TRUE,
                	s3 := TRUE,
                	s4 := TRUE,
                	s5 := 1::SMALLINT,
                	s6 := 2::SMALLINT,
                	sg0e := ARRAY[]::BIGINT[],
                	sg1e := ARRAY[]::BIGINT[]
                )
                */
            })

            it("taxonomic_ranks", () => {

                const config = {
                    "params": {
                        "sg0e": {
                            "type": "id_array"
                        }
                    },
                    "vars": {
                        "fv0": {
                            "type": "id_array",
                            "val": [
                                [
                                    4276260
                                ]
                            ]
                        },
                        "p0": {
                            "type": "id_array"
                        },
                        "g0": {
                            "type": "id_array"
                        }
                    },
                    "queries": [
                        {
                            "type": "set",
                            "set": "p0",
                            "to": [
                                [
                                    3611
                                ]
                            ]
                        },
                        {
                            "limit": 50,
                            "group": 0,
                            "type": "class_filter",
                            "class": [
                                "fv0"
                            ]
                        },
                        {
                            "type": "claim",
                            "group": 0,
                            "identities": {
                                "label": true,
                                "alias": true,
                                "description": false,
                                "sitelink": false,
                                "class": false
                            },
                            "props": {
                                "entity_ref": [
                                    "p0"
                                ]
                            }
                        }
                    ],
                    "hash": "i_f_0"
                }

                const sqlFunction = sqlConverter.createFunction(config, ',');

                const expRes = `CREATE FUNCTION i_f_0 (
                        p_lang labels.language%TYPE = 'en',
                        p_site sitelinks.site%TYPE = 'enwiki',
                        sg0e BIGINT[] = ARRAY[]::BIGINT[]
                    )

                    RETURNS SETOF data_set AS $$

                    DECLARE
                        ds data_set%ROWTYPE;
                        row RECORD;
                        e_id BIGINT;
                        claims VARCHAR(127)[];
                        fv0 BIGINT[] = ARRAY[4276260]::BIGINT[];
                        p0 BIGINT[] = ARRAY[]::BIGINT[];
                        g0 BIGINT[] = ARRAY[]::BIGINT[];

                    BEGIN

                        p0 = ARRAY[3611];

                        g0 := ARRAY_CAT(
                            g0,get_instances_of(
                                fv0,
                                50::SMALLINT
                            )
                        );
                        FOREACH e_id IN ARRAY g0
                        LOOP
                            ds.type := 'g';
                            ds.subject := 0;
                            ds.val := e_id;
                            ds.prop := 0;
                            ds.spec1 := '';
                            ds.spec2 := '';
                            ds.rank := 0;
                        RETURN NEXT ds;
                        END LOOP;


                        IF (ARRAY_LENGTH(g0, 1) > 0)
                        THEN
                            g0 = exclude_ids(g0, sg0e);

                            IF (ARRAY_LENGTH(g0, 1) > 0)
                            THEN
                                FOR ds IN
                                    SELECT *
                                    FROM get_values (
                                        g0,true,true,false,false,false,p_lang,p_site,
                                        p_entity_ref_ids := p0
                                    )
                                LOOP RETURN NEXT ds;
                                END LOOP;

                            END IF;

                        END IF;

                    RETURN;END;$$ LANGUAGE 'plpgsql';`;

                expect(diffLines(expRes, sqlFunction)).to.equal(false);

                /* test call
                SELECT * FROM i_f_0 (
                	p_lang := 'en',
                	p_site := 'enwiki'
                )
                */
            })

            it("connected, part of same theme, and adjacent events", () => {

                const config = {
                    "params": {
                        "s0": {
                            "type": "id_array"
                        },
                        "s1": {
                            "type": "bool"
                        },
                        "s2": {
                            "type": "bool"
                        },
                        "s3": {
                            "type": "bool"
                        },
                        "s4": {
                            "type": "bool"
                        },
                        "s5": {
                            "type": "bool"
                        },
                        "s6": {
                            "type": "bool"
                        },
                        "s7": {
                            "type": "big_int"
                        },
                        "s8": {
                            "type": "big_int"
                        },
                        "sg0e": {
                            "type": "id_array"
                        },
                        "sg1e": {
                            "type": "id_array"
                        },
                        "sg2e": {
                            "type": "id_array"
                        },
                    },
                    "vars": {
                        "fv0": {
                            "type": "small_int",
                            "val": 1
                        },
                        "p0": {
                            "type": "id_array"
                        },
                        "p1": {
                            "type": "id_array"
                        },
                        "p2": {
                            "type": "id_array"
                        },
                        "p3": {
                            "type": "id_array"
                        },
                        "p4": {
                            "type": "id_array"
                        },
                        "p5": {
                            "type": "id_array"
                        },
                        "p6": {
                            "type": "id_array"
                        },
                        "p7": {
                            "type": "id_array"
                        },
                        "p8": {
                            "type": "id_array"
                        },
                        "p9": {
                            "type": "id_array"
                        },
                        "p10": {
                            "type": "id_array"
                        },
                        "p11": {
                            "type": "id_array"
                        },
                        "p12": {
                            "type": "id_array"
                        },
                        "p13": {
                            "type": "id_array"
                        },
                        "p14": {
                            "type": "id_array"
                        },
                        "p15": {
                            "type": "id_array"
                        },
                        "p16": {
                            "type": "id_array"
                        },
                        "p17": {
                            "type": "id_array"
                        },
                        "g0": {
                            "type": "id_array"
                        },
                        "g1": {
                            "type": "id_array"
                        },
                        "vg1_p11_a": {
                            "type": "id_array"
                        },
                        "g2": {
                            "type": "id_array"
                        },
                        "g0_p3_v": {
                            "type": "id_array"
                        },
                        "g0_p4_v": {
                            "type": "id_array"
                        }
                    },
                    "queries": [
                        // sets
                        {
                            "type": "set",
                            "set": "p0",
                            "to": [
                                [
                                    3611
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p1",
                            "to": [
                                [
                                    1791
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p2",
                            "to": [
                                [
                                    7101
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p3",
                            "to": [
                                [
                                    2761
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p4",
                            "to": [
                                [
                                    171
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p5",
                            "to": [
                                [
                                    8281
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p6",
                            "to": [
                                [
                                    14521
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p7",
                            "to": [
                                [
                                    14781
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p8",
                            "to": [
                                [
                                    15361
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p9",
                            "to": [
                                [
                                    1551
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p10",
                            "to": [
                                [
                                    1561
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p11",
                            "to": [
                                [
                                    181
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p12",
                            "to": [
                                [
                                    411
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p13",
                            "to": [
                                [
                                    11201
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p14",
                            "to": [
                                [
                                    6251
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p15",
                            "to": [
                                [
                                    5851
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p16",
                            "to": [
                                [
                                    5801
                                ]
                            ]
                        },
                        {
                            "type": "set",
                            "set": "p17",
                            "to": [
                                [
                                    5821
                                ]
                            ]
                        },
                        // group 0
                        //      filter
                        {
                            "type": "set",
                            "set": "g0",
                            "to": [
                                "s0"
                            ]
                        },
                        //      prop
                        {
                            "type": "claim",
                            "group": 0,
                            "identities": {
                                "label": true,
                                "alias": true,
                                "description": true,
                                "sitelink": true,
                                "class": true
                            },
                            "props": {
                                "entity_ref": [
                                    "p0",
                                    "p1",
                                    "p2",
                                    "p3",
                                    "p4",
                                    "p5",
                                    "p6",
                                    "p7",
                                    "p8",
                                    "p9",
                                    "p10"
                                ],
                                "string": [
                                    "p11"
                                ],
                                "quantity": [
                                    "p13"
                                ],
                                "globe_coords": [
                                    "p14"
                                ],
                                "datetime": [
                                    "p15",
                                    "p16",
                                    "p17"
                                ]
                            },
                            "subs": [
                                {
                                    "type": "value_var",
                                    "prop": "p3",
                                    "vars": {
                                        "val": "g0_p3_v"
                                    }
                                },
                                {
                                    "type": "value_var",
                                    "prop": "p4",
                                    "vars": {
                                        "val": "g0_p4_v"
                                    }
                                }
                            ]
                        },
                        // group 1
                        //      filter
                        {
                            "limit": 50,
                            "group": 1,
                            "type": "connected_to_filter",
                            "entities": [
                                "g0"
                            ],
                            "up_props": [
                                "p0"
                            ],
                            "down_props": [
                                "p1"
                            ],
                            "up_depth": "fv0",
                            "down_depth": "fv0",
                            "cousin_depth": "fv0"
                        },
                        {
                            "type": "set",
                            "if": "s6",
                            "set": "vg1_p11_a",
                            "to": "p11"
                        },
                        //      prop
                        {
                            "type": "claim",
                            "group": 1,
                            "identities": {
                                "label": true,
                                "alias": "s4",
                                "description": "s5",
                                "sitelink": true,
                                "class": true
                            },
                            "props": {
                                "entity_ref": [
                                    "p0",
                                    "p1",
                                    "p2",
                                    "p3",
                                    "p4"
                                ],
                                "string": [
                                    "vg1_p11_a"
                                ],
                                "quantity": [
                                    "p13"
                                ],
                                "globe_coords": [
                                    "p14"
                                ],
                                "datetime": [
                                    "p15",
                                    "p16",
                                    "p17"
                                ]
                            },
                            "if": "s1"
                        },
                        // group 2
                        //      filter
                        {
                            "type": "set",
                            "set": "g2",
                            "to": [
                                "g0_p3_v",
                                "g0_p4_v"
                            ]
                        },
                        //      prop
                        {
                            "type": "claim",
                            "group": 2,
                            "identities": {
                                "label": true,
                                "alias": false,
                                "description": false,
                                "sitelink": false,
                                "class": false
                            },
                            "props": {
                                "entity_ref": [
                                    "p12"
                                ],
                                "globe_coords": [
                                    "p14"
                                ]
                            }
                        }
                    ],
                    "hash": "i_f_0"
                }

                const sqlFunction = sqlConverter.createFunction(config, ',');

                const expRes = `CREATE FUNCTION i_f_0 (
                        p_lang labels.language%TYPE = 'en',
                        p_site sitelinks.site%TYPE = 'enwiki',
                        s0 BIGINT[] = ARRAY[]::BIGINT[],
                        s1 BOOLEAN = FALSE,
                        s2 BOOLEAN = FALSE,
                        s3 BOOLEAN = FALSE,
                        s4 BOOLEAN = FALSE,
                        s5 BOOLEAN = FALSE,
                        s6 BOOLEAN = FALSE,
                        s7 BIGINT = 0,
                        s8 BIGINT = 0,
                        sg0e BIGINT[] = ARRAY[]::BIGINT[],
                        sg1e BIGINT[] = ARRAY[]::BIGINT[],
                        sg2e BIGINT[] = ARRAY[]::BIGINT[]
                    )

                    RETURNS SETOF data_set AS $$

                    DECLARE
                        ds data_set%ROWTYPE;
                        row RECORD;
                        e_id BIGINT;
                        claims VARCHAR(127)[];
                        fv0 SMALLINT = 1;
                        p0 BIGINT[] = ARRAY[]::BIGINT[];
                        p1 BIGINT[] = ARRAY[]::BIGINT[];
                        p2 BIGINT[] = ARRAY[]::BIGINT[];
                        p3 BIGINT[] = ARRAY[]::BIGINT[];
                        p4 BIGINT[] = ARRAY[]::BIGINT[];
                        p5 BIGINT[] = ARRAY[]::BIGINT[];
                        p6 BIGINT[] = ARRAY[]::BIGINT[];
                        p7 BIGINT[] = ARRAY[]::BIGINT[];
                        p8 BIGINT[] = ARRAY[]::BIGINT[];
                        p9 BIGINT[] = ARRAY[]::BIGINT[];
                        p10 BIGINT[] = ARRAY[]::BIGINT[];
                        p11 BIGINT[] = ARRAY[]::BIGINT[];
                        p12 BIGINT[] = ARRAY[]::BIGINT[];
                        p13 BIGINT[] = ARRAY[]::BIGINT[];
                        p14 BIGINT[] = ARRAY[]::BIGINT[];
                        p15 BIGINT[] = ARRAY[]::BIGINT[];
                        p16 BIGINT[] = ARRAY[]::BIGINT[];
                        p17 BIGINT[] = ARRAY[]::BIGINT[];
                        g0 BIGINT[] = ARRAY[]::BIGINT[];
                        g1 BIGINT[] = ARRAY[]::BIGINT[];
                        vg1_p11_a BIGINT[] = ARRAY[]::BIGINT[];
                        g2 BIGINT[] = ARRAY[]::BIGINT[];
                        g0_p3_v BIGINT[] = ARRAY[]::BIGINT[];
                        g0_p4_v BIGINT[] = ARRAY[]::BIGINT[];

                    BEGIN

                        p0 = ARRAY[3611];

                        p1 = ARRAY[1791];

                        p2 = ARRAY[7101];

                        p3 = ARRAY[2761];

                        p4 = ARRAY[171];

                        p5 = ARRAY[8281];

                        p6 = ARRAY[14521];

                        p7 = ARRAY[14781];

                        p8 = ARRAY[15361];

                        p9 = ARRAY[1551];

                        p10 = ARRAY[1561];

                        p11 = ARRAY[181];

                        p12 = ARRAY[411];

                        p13 = ARRAY[11201];

                        p14 = ARRAY[6251];

                        p15 = ARRAY[5851];

                        p16 = ARRAY[5801];

                        p17 = ARRAY[5821];

                        g0 = s0;

                        IF (ARRAY_LENGTH(g0, 1) > 0)
                        THEN
                            g0 = exclude_ids(g0, sg0e);

                            IF (ARRAY_LENGTH(g0, 1) > 0)
                            THEN
                                CREATE TEMP TABLE temp_table AS (
                                    SELECT *
                                    FROM get_values (
                                        g0,true,true,true,true,true,p_lang,p_site,
                                        p_entity_ref_ids := p0||p1||p2||p3||p4||p5||p6||p7||p8||p9||p10,
                                        p_string_ids := p11,
                                        p_quantity_ids := p13,
                                        p_globe_coords_ids := p14,
                                        p_datetime_ids := p15||p16||p17
                                    )
                                );

                                FOR ds IN
                                    SELECT *
                                    FROM temp_table
                                LOOP RETURN NEXT ds;
                                END LOOP;

                                FOR row IN
                                    SELECT val
                                    FROM temp_table
                                    WHERE prop = ANY(p3)
                                LOOP
                                    g0_p3_v := ARRAY_APPEND (g0_p3_v,row.val::BIGINT);
                                END LOOP;

                                FOR row IN
                                    SELECT val
                                    FROM temp_table
                                    WHERE prop = ANY(p4)
                                LOOP
                                    g0_p4_v := ARRAY_APPEND (g0_p4_v,row.val::BIGINT);
                                END LOOP;

                                DROP TABLE temp_table;
                            END IF;

                        END IF;


                        g1 := ARRAY_CAT(
                            g1,get_connected_entities(
                                g0,
                                p0,
                                p1,
                                p_up_depth := fv0::SMALLINT,
                                p_down_depth := fv0::SMALLINT,
                                p_cousin_depth := fv0::SMALLINT,
                                p_limit := 50::SMALLINT
                            )
                        );
                        FOREACH e_id IN ARRAY g1
                        LOOP
                            ds.type := 'g';
                            ds.subject := 1;
                            ds.val := e_id;
                            ds.prop := 0;
                            ds.spec1 := '';
                            ds.spec2 := '';
                            ds.rank := 0;
                        RETURN NEXT ds;
                        END LOOP;


                        IF s6 THEN
                            vg1_p11_a = p11;
                        END IF;


                        IF s1
                        THEN
                            IF (ARRAY_LENGTH(g1, 1) > 0)
                            THEN
                                g1 = exclude_ids(g1, sg1e);

                                IF (ARRAY_LENGTH(g1, 1) > 0)
                                THEN
                                    FOR ds IN
                                        SELECT *
                                        FROM get_values (
                                            g1,true,s4,s5,true,true,p_lang,p_site,
                                            p_entity_ref_ids := p0||p1||p2||p3||p4,
                                            p_string_ids := vg1_p11_a,
                                            p_quantity_ids := p13,
                                            p_globe_coords_ids := p14,
                                            p_datetime_ids := p15||p16||p17
                                        )
                                    LOOP RETURN NEXT ds;
                                    END LOOP;

                                END IF;

                            END IF;

                        END IF;


                        g2 = g0_p3_v||g0_p4_v;

                        IF (ARRAY_LENGTH(g2, 1) > 0)
                        THEN
                            g2 = exclude_ids(g2, sg2e);

                            IF (ARRAY_LENGTH(g2, 1) > 0)
                            THEN
                                FOR ds IN
                                    SELECT *
                                    FROM get_values (
                                        g2,true,false,false,false,false,p_lang,p_site,
                                        p_entity_ref_ids := p12,
                                        p_globe_coords_ids := p14
                                    )
                                LOOP RETURN NEXT ds;
                                END LOOP;

                            END IF;

                        END IF;


                    RETURN;END;$$ LANGUAGE 'plpgsql';`;

                expect(diffLines(expRes, sqlFunction)).to.equal(false);

                /* test call
                SELECT * FROM i_f_0 (
                	p_lang := 'en',
                	p_site := 'enwiki',
                	s0 := ARRAY[164710]::BIGINT[],
                	s1 := TRUE
                )
                */
            })

            // map (custom url)

            // also works with datetime
        })

    })

})

/*
SELECT udf_dropfunction ('i_f_0');
CREATE FUNCTION i_f_0 (

SELECT * FROM i_f_0 (
	p_lang := 'en',
	p_site := 'enwiki',
	s0 := ARRAY[1400]::BIGINT[],
	s1 := TRUE,
	s2 := TRUE,
	s3 := TRUE,
	s4 := TRUE,
	s5 := 1::SMALLINT,
	s6 := 2::SMALLINT,
	sg0e := ARRAY[]::BIGINT[],
	sg1e := ARRAY[]::BIGINT[]
)
*/
