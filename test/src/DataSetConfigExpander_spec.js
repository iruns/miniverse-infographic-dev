// testee
import * as expander from '../../src/DataSetConfigExpander';

// utils
import _ from 'lodash';

// chai
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from "sinon-chai";

chai.use(sinonChai);

/*
npm test -- --grep "DataSetConfigExpander"
*/

describe("DataSetConfigExpander ->", () => {

    describe("isVar()", () => {

        it("returns TRUE if it receives string starting with = sign", () => {
            expect(expander.isVar("=something")).to.equal(true);
        })

        it("returns FALSE if it receives anything else", () => {
            expect(expander.isVar("something")).to.equal(false);
            expect(expander.isVar([])).to.equal(false);
            expect(expander.isVar(123)).to.equal(false);
            expect(expander.isVar({})).to.equal(false);
        })
    })

    describe("toVar()", () => {

        it("returns var without the = sign", () => {
            expect(expander.toVar({
                variable: "=something"
            })).to.equal("something");
        })

        it("returns group var with postFix", () => {
            expect(expander.toVar({
                variable: "=g0_p0",// group 0, property 0
                postFix: "v", // from column "v"
                groupValues: {}
            })).to.equal("g0_p0_v");
        })

        it("fills groupValues (temp holder for list if groups' prop values that need to be saved) if given group var", () => {

            const groupValues = {};

            expander.toVar({
                variable: "=g0_p0",
                postFix: "v",
                groupValues: groupValues
            });

            expect(groupValues).to.deep.equal({
                g0: {
                    props: ["p0"],
                    qualifiers: {},
                    references: {},
                }
            });
        })

        it("fills groupValues if given group prop qualifier var", () => {

            const groupValues = {};

            expander.toVar({
                variable: "=g0_p0_q_e_p2",// group 0, prop 0, entity qualifier, prop 2
                postFix: "v",
                groupValues: groupValues
            });

            expect(groupValues).to.deep.equal({
                g0: {
                    props: [],
                    qualifiers: {"p0": ["p2"]},
                    references: {},
                }
            });
        })

        it("fills groupValues if given group prop reference var", () => {

            const groupValues = {};

            expander.toVar({
                variable: "=g0_p0_r_p2",// group 0, prop 0, reference, prop 2
                postFix: "v",
                groupValues: groupValues
            });

            expect(groupValues).to.deep.equal({
                g0: {
                    props: [],
                    qualifiers: {},
                    references: {"p0": ["p2"]},
                }
            });
        })

    })


    describe("expandFilter()", () => {

        describe("working with >> id filter ->", () => {

            describe("working without settings", () => {

                const xQueries = [];

                before(() => {

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 0,
                        filter: { id: ["=s0"] },
                    });
                })

                it('generates "set" query for assigning entities to be in the group ->', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: "set",
                            set: "g0", to: ["s0"]
                        },
                    ]);
                })
            })

            describe(`working with settings"`, () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = {
                        id: ["=s0"],
                        orderings: [
                            { order_by: "=p1", order: "DESC"},
                            { order_by: "=p0"},
                        ],
                        limit: 100,
                        offset: "=s2"
                    };

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 1,
                        filter: filterConfig,
                    });
                })

                // Add if here instead
                it('generates a query with only "if" setting', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: "set",

                            set: "g1", to: ["s0"]
                        },
                    ]);
                })
            })
        })

        describe("working with >> class filter ->", () => {

            describe("working without settings", () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = { class: ["=v0"] };

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 0,
                        filter: filterConfig,
                    });
                })

                it('generates "class" query + if ', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: 'class_filter',

                            group: 0,
                            class: ["v0"],

                            limit: expander.defaultValues.limit
                        },
                    ]);
                })
            })

            describe("working with settings", () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = {
                        class: ["=v0"],
                        orderings: [
                            { order_by: "=p1", order: "DESC"},
                            { order_by: "=p0"},
                        ],
                        limit: 100,
                        offset: "=s2"
                    };

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 1,
                        filter: filterConfig,
                    });
                })

                it('generates a query with the settings, except for orderings', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: 'class_filter',

                            class: ["v0"],

                            group: 1,
                            limit: 100
                        }
                    ]);
                })
            })
        })

        describe("working with >> recursively connected filter ->", () => {

            describe("working without settings", () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = {
                        connected: {
                            to: ["=g0"],

                            up_props: ["=v0"],
                            down_props: ["=p10"],

                            up_depth: "=s2",
                            down_depth: "=s3",
                            cousin_depth: 1
                        }
                    };

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 1,
                        filter: filterConfig,
                    });
                })

                it('generates "connected_to" query', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: 'connected_to_filter',

                            group: 1,

                            entities: ["g0"],

                            up_props: ["v0"],
                            down_props: ["p10"],

                            up_depth: "s2",
                            down_depth: "s3",
                            cousin_depth: 1,

                            limit: expander.defaultValues.limit
                        },
                    ]);
                })
            })

            describe("working with settings", () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = {

                        connected: {
                            to: ["=g0"],

                            up_props: ["=v0"],
                            down_props: ["=p10"],

                            up_depth: "=s2",
                            down_depth: "=s3",
                            cousin_depth: 1
                        },
                        orderings: [
                            { order_by: "=p1", order: "DESC"},
                            { order_by: "=p0"},
                        ],
                        limit: 100,
                        offset: "=s2"
                    };

                    expander.expandFilter({
                        queries: xQueries,
                        groupValues: {},
                        groupidx: 1,
                        filter: filterConfig,
                    });
                })

                it('generates a query with the settings, except for orderings', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: 'class_filter',

                            type: 'connected_to_filter',

                            group: 1,

                            entities: ["g0"],

                            up_props: ["v0"],
                            down_props: ["p10"],

                            up_depth: "s2",
                            down_depth: "s3",
                            cousin_depth: 1,

                            group: 1,
                            limit: 100
                        }
                    ]);
                })
            })
        })

        describe("working with props filter", () => {

            describe("working with settings", () => {

                const xQueries = [];

                before(() => {
                    const filterConfig = {
                        "p0": { is: ["=g0_p0"], if: "=s0"},
                        orderings: [
                            { order_by: "=p0_q_e_p1", order: "ASC"},
                            { order_by: "=p0"},
                        ],
                        limit: 100,
                        offset: "=s2"
                    };

                    expander.expandFilter({
                        queries: xQueries,
                        props: [
                            {prop_type: "entity_ref"}
                        ],
                        groupValues: {},
                        groupidx: 1,
                        filter: filterConfig,
                    });
                })

                it('generates a query with the settings', () => {

                    expect(xQueries).to.deep.equal([
                        {
                            type: "props_filter",

                            group: 1,
                            orderings: [
                                {order_by: "p0_q_e_p1", order: "ASC"},
                                {order_by: "p0", order: expander.defaultValues.order},
                            ],
                            limit: 100,
                            offset: "s2",

                            subs: [
                                {
                                    table: "entity_ref",
                                    prop: "p0",
                                    if: "s0",

                                    exacts: {
                                        value: ["g0_p0_v"]
                                    }
                                },
                            ]
                        }
                    ]);
                })
            })

            // working with no settings, below
        })
    })

    describe("expandPropFilter()", () => {

        it("creates entity_ref filter sub", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "entity_ref"}
                ],
                groupValues: {},
                filter: {
                    "p0": { is: ["=g0_p0"], if: "=s0"}
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "entity_ref",
                    prop: "p0",
                    if: "s0",

                    exacts: {
                        value: ["g0_p0_v"]
                    }
                },
            ]);
        })

        it("creates string and globe_coordinates filter sub", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "string"},
                    {prop_type: "globe_coordinates"},
                ],
                groupValues: {},
                filter: {
                    "p0": { is: ["abc", "=g0_p0"]},
                    "p1": { is: ["=g0_p1", {long: 10, lat: 20}]},
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "string",
                    prop: "p0",

                    exacts: {
                        value: [
                            ["abc"],
                            "g0_p0_v"
                        ],
                    },
                },
                {
                    table: "globe_coordinates",
                    prop: "p1",

                    exacts: {
                        value: [
                            [{long: 10, lat: 20}],
                            "g0_p1_v"
                        ]
                    }
                },
            ]);
        })

        it("creates quantity filter sub, both for exact amount and range", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "quantity"},
                    {prop_type: "quantity"},
                ],
                groupValues: {},
                filter: {
                    "p0": {
                        amount: [10.1, 20, "=v0"],
                        unit: ["1"],
                    },
                    "p1": {
                        amount: [10.1, 20, "=v1"],
                        unit: ["=v2"],
                        lower_range: 2,
                        upper_range: "=v3",
                    },
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "quantity",
                    prop: "p0",

                    exacts: {
                        unit: [["'1'"]],
                    },
                    ranges: {
                        amount: {
                            points: [[10.1, 20], "v0"],

                            lower_range: 0,
                            upper_range: 0,
                        },
                    }
                },
                {
                    table: "quantity",
                    prop: "p1",

                    exacts: {
                        unit: ["v2"],
                    },
                    ranges: {
                        amount: {
                            points: [[10.1, 20], "v1"],

                            lower_range: 2,
                            upper_range: "v3",
                        },
                    }
                },
            ]);
        })

        it("creates datetime filter sub, both for exact amount and range", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "datetime"},
                    {prop_type: "datetime"},
                ],
                groupValues: {},
                filter: {
                    "p0": {
                        datetime: [
                            "1200-01-20",
                            "-1000-01-02",
                            "15-00-1",
                            "-1000000",
                            "=v0"
                        ],
                    },
                    "p1": {
                        datetime: ["1200-1-20"],
                        calendar_model_id: ["Q1985727"],
                        lower_range: "=s0",
                        upper_range: {y: 100, m:5},
                    },
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "datetime",
                    prop: "p0",

                    exacts: {
                        calendar_model_id: [[19857270]],
                    },
                    ranges: {
                        datetime: {
                            points: [
                                [
                                    437944,
                                    -365241,
                                    5113,
                                    -365242200
                                ],
                                "v0"
                            ],

                            lower_range: 0,
                            upper_range: 0,
                        },
                    }
                },
                {
                    table: "datetime",
                    prop: "p1",

                    exacts: {
                        calendar_model_id: [[19857270]],
                    },
                    ranges: {
                        datetime: {
                            points: [[437944]],

                            lower_range: "s0",
                            upper_range: 36674,
                        },
                    }
                },
            ]);
        })

        it("creates claim qualifier (entity qualifier) filter sub sub", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "entity_ref"},
                    {prop_type: "entity_ref"},
                ],
                groupValues: {},
                filter: {
                    "p0": {
                        is: ["=g0_p0"],
                        where: {
                            qualifiers: {
                                "p1": { is: ["=s1"], if: "=s0"},
                            }
                        },
                    }
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "entity_ref",
                    prop: "p0",

                    exacts: {
                        value: ["g0_p0_v"]
                    },

                    subs: [
                        {
                            table: "entity_ref",
                            prop: "p1",
                            if: "s0",

                            detail_table: "claim_qualifiers",
                            claim_prefix: "e",

                            exacts: {
                                value: ["s1"]
                            },
                        },
                    ]
                },
            ]);
        })

        it("creates claim reference filter sub sub", () => {

            const xQuery = {};
            expander.expandPropFilter({
                query: xQuery,
                props: [
                    {prop_type: "entity_ref"},
                    {prop_type: "entity_ref"},
                ],
                groupValues: {},
                filter: {
                    "p0": {
                        is: ["=g0_p0"],
                        where: {
                            "references":{
                                "p1": { is: ["=s1"], if: "=s0"},
                            }
                        },
                    }
                }
            });

            expect(xQuery.subs).to.deep.equal([
                {
                    table: "entity_ref",
                    prop: "p0",

                    exacts: {
                        value: ["g0_p0_v"]
                    },

                    subs: [
                        {
                            table: "entity_ref",
                            prop: "p1",
                            if: "s0",

                            detail_table: "claim_references",
                            claim_prefix: "r",

                            exacts: {
                                value: ["s1"]
                            },
                        },
                    ]
                },
            ]);
        })

    })

    describe("includeGroupValues()", () => {

        describe("working with entity_ref, string, and globe_coords property ->", () => {

            const xQuery = {
                type: "claim",
                group: 0,
                identities: {},
                props: {},
            };

            const xVars = {};

            before(() => {

                expander.includeGroupValues({
                    xQuery: xQuery,
                    xVars: xVars,
                    props: [
                        {"prop_type": "entity_ref"},
                        {"prop_type": "string"},
                        {"prop_type": "globe_coords"},
                    ],
                    groupValues: {
                        "g0": {
                            props: ["p0", "p1", "p2"],
                            qualifiers: {},
                            references: {},
                        },
                    },
                });
            })

            it("adds simple value_var query ", () => {

                expect(xQuery.subs).to.deep.equal([
                    {
                        type: 'value_var',
                        prop: "p0",
                        vars: {
                            val: "g0_p0_v"
                        }
                    },
                    {
                        type: 'value_var',
                        prop: "p1",
                        vars: {
                            val: "g0_p1_v"
                        }
                    },
                    {
                        type: 'value_var',
                        prop: "p2",
                        vars: {
                            val: "g0_p2_v"
                        }
                    },
                ])
            })

            it("adds var declaration according to the prop_type", () => {

                expect(xVars).to.deep.equal({
                    "g0_p0_v": {
                        type: "id_array"
                    },
                    "g0_p1_v": {
                        type: "string_255_array"
                    },
                    "g0_p2_v": {
                        type: "globe_coords_array"
                    },
                })
            })
        })

        describe("working with quantity and datetime property ->", () => {

            const xQuery = {
                type: "claim",
                group: 0,
                identities: {},
                props: {},
            };

            const xVars = {};

            before(() => {

                expander.includeGroupValues({
                    xQuery: xQuery,
                    xVars: xVars,
                    props: [
                        {"prop_type": "quantity"},
                        {"prop_type": "datetime"},
                    ],
                    groupValues: {
                        "g0": {
                            props: ["p0", "p1"],
                            qualifiers: {},
                            references: {},
                        },
                    },
                });
            })

            it("adds simple value_var query ", () => {

                expect(xQuery.subs).to.deep.equal([
                    {
                        type: 'value_var',
                        prop: "p0",
                        vars: {
                            val: "g0_p0_v",
                            val4: "g0_p0_v4",
                        }
                    },
                    {
                        type: 'value_var',
                        prop: "p1",
                        vars: {
                            val: "g0_p1_v",
                            val4: "g0_p1_v4",
                        }
                    },
                ])
            })

            it("adds var declaration according to the prop_type", () => {

                expect(xVars).to.deep.equal({
                    "g0_p0_v": {
                        type: "quantity_array"
                    },
                    "g0_p0_v4": {
                        type: "string_127_array"
                    },
                    "g0_p1_v": {
                        type: "big_int_array"
                    },
                    "g0_p1_v4": {
                        type: "id_array"
                    },
                })
            })
        })

        describe("working with qualifier and references ->", () => {

            const xQuery = {
                type: "claim",
                group: 0,
                identities: {},
                props: {},

                subs: [
                    {
                        type: "qualifier",
                        prop: "p1",
                        qualifiers: {
                            entity_ref: [2]
                        },
                    },
                    {
                        type: "reference",
                        prop: "p1",
                        references: {
                            entity_ref: [1]
                        },
                    },
                ]
            }

            const xVars = {};

            before(() => {

                expander.includeGroupValues({
                    xQuery: xQuery,
                    xVars: xVars,
                    props: [
                        {"prop_type": "entity_ref"},
                        {"prop_type": "entity_ref"},
                        {"prop_type": "entity_ref"},
                    ],
                    groupValues: {
                        "g0": {
                            props: [],
                            qualifiers: {"p1": ["p2"]},
                            references: {"p1": ["p1"]},
                        },
                    },
                });
            })

            it("adds simple value_var query ", () => {

                expect(xQuery.subs).to.deep.equal([
                    {
                        type: 'qualifier',
                        prop: "p1",
                        qualifiers: {
                            entity_ref: [2]
                        },
                        subs: [
                            {
                                type: 'value_var',
                                prop: "p2",
                                vars: {
                                    val: "g0_p1_q_e_p2_v"
                                }
                            },
                        ]
                    },
                    {
                        type: 'reference',
                        prop: "p1",
                        references: {
                            entity_ref: [1]
                        },
                        subs: [
                            {
                                type: 'value_var',
                                prop: "p1",
                                vars: {
                                    val: "g0_p1_r_p1_v"
                                }
                            },
                        ]
                    },
                ])
            })

            it("adds var declaration according to the prop_type", () => {

                expect(xVars).to.deep.equal({
                    "g0_p1_q_e_p2_v": {
                        type: "id_array"
                    },
                    "g0_p1_r_p1_v": {
                        type: "id_array"
                    },
                })
            })
        })

    })



    describe("expandFixedVars()", () => {

        describe("working with >> id ->", () => {

            it("converts single id string to id number", () => {

                const fixedVars = [
                    {
                        type: "id",
                        val: "Q1"
                    }
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'id',
                        val: 10
                    },
                })
            })

            it("converts id array string to id number array", () => {

                const fixedVars = [
                    {
                        type: "id_array",
                        val: ["Q1", "Q2"]
                    },
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'id_array',
                        val: [[10, 20]]
                    },
                })
            })
        })

        describe("working with >> datetime ->", () => {

            it("converts single datetime string to datetime number", () => {

                const fixedVars = [
                    {
                        type: "datetime",
                        val: "1944-11-3"
                    }
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'datetime',
                        val: 709972
                    },
                })
            })

            it("converts datetime array string to datetime number array", () => {

                const fixedVars = [
                    {
                        type: "datetime_array",
                        val: [
                            "1944-11-3",
                            "1944-11-13"
                        ]
                    }
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'datetime_array',
                        val: [[
                            709972,
                            709982
                        ]]
                    },
                })
            })
        })

        describe("working with >> others ->", () => {

            it("converts single var", () => {

                const fixedVars = [
                    {
                        type: "globe_coords",
                        val: {long: 10, lat: 20}
                    }
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'globe_coords',
                        val: {long: 10, lat: 20}
                    },
                })
            })

            it("converts var array", () => {

                const fixedVars = [
                    {
                        type: "globe_coords_array",
                        val: [
                            {long: 10, lat: 20},
                            {long: 30, lat: 40}
                        ]
                    }
                ]

                const xVars = {};
                expander.expandFixedVars(fixedVars, xVars);

                expect(xVars).to.deep.equal({
                    "fv0": {
                        type: 'globe_coords_array',
                        val: [
                            [
                                {long: 10, lat: 20},
                                {long: 30, lat: 40}
                            ]
                        ]
                    },
                })
            })
        })
    })

    describe("expandProps()", () => {

        const xVars = {};
        const xQueries = [];

        before(() => {
            expander.expandProps(
                [
                    {id: ["Q1", "Q2", "=v0"]}
                ],
                xVars,
                xQueries
            )
        })

        it("fills vars (var declaration) with an empty id) array var", () => {
            expect(xVars).to.deep.equal({
                "p0": {type: "id_array"}
            })
        })

        it("fills queries with a query that fills the var (prop) with the values (ids)", () => {
            expect(xQueries).to.deep.equal([
                {
                    type: "set",
                    set: "p0",
                    to: [[10, 20], "v0"]
                }
            ])
        })
    })

    describe("expandGroups()", () => {

        let xDataSetConfig;
        let xParams;
        let xVars;
        let xQueries;

        describe("working with >> selection, identity only ->", () => {

            before(() => {

                xParams = {};
                xVars = {};
                xQueries = [];

                xDataSetConfig = expander.expandGroups({
                    cGroups: [
                        {
                            // filter
                            where: { id: ["=s0"] },

                            get: {
                                identities:{
                                    "label": {},
                                    "alias": {},
                                    "sitelink": {},
                                },
                            },
                        },
                    ],
                    xParams: xParams,
                    xVars: xVars,
                    xQueries: xQueries
                });
            })

            it("expands params to and existing group0 members (sg0e)", () => {

                expect(xParams).to.deep.equal({
                    // selection's existing member
                    "sg0e": {type: 'id_array'},
                });
            })

            it("expands vars to include selection var (g0)", () => {

                expect(xVars).to.deep.equal({
                    "g0": {type: 'id_array'},
                });
            })

            it("expands queries to include setting selection from setting (s0) and getting its' identities", () => {

                expect(xQueries).to.deep.equal([
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                    },
                ]);
            })

        })

        describe("working with >> selection, + props ->", () => {

            before(() => {

                xParams = {};
                xVars = {};
                xQueries = [];

                xDataSetConfig = expander.expandGroups({
                    cGroups: [
                        {
                            // filter
                            where: { id: ["=s0"] },

                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                    "alias": {},
                                    "sitelink": {},
                                },
                                // props
                                props: {
                                    "p0": {}, // conservation_status
                                    "p1": {} // image
                                }
                            },
                        },
                    ],
                    cProps: [
                        // conservation_status
                        {
                            prop_type: "entity_ref",
                            id: ["P141"]
                        },
                        // image
                        {
                            prop_type: "string",
                            id: ["P18"],
                        },
                    ],
                    xParams: xParams,
                    xVars: xVars,
                    xQueries: xQueries
                });
            })

            it("expands queries to include identities and props", () => {

                expect(xQueries).to.deep.equal([
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },

                        props: {
                            entity_ref: ["p0"],
                            string: ["p1"],
                        }
                    },
                ]);
            })

        })

        describe("working with >> selection, + props + if ->", () => {

            before(() => {

                xParams = {};
                xVars = {};
                xQueries = [];

                xDataSetConfig = expander.expandGroups({
                    cGroups: [
                        {
                            if: "=s4",

                            // filter
                            where: { id: ["=s0"] },

                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                    "alias": {if: "=s1"},
                                    "sitelink": {},
                                },
                                // props
                                props: {
                                    "p0": {}, // conservation_status
                                    "p1": {if: "=s2"} // image
                                }
                            },
                        },
                    ],
                    cProps: [
                        // conservation_status
                        {
                            prop_type: "entity_ref",
                            id: ["P141"]
                        },
                        // image
                        {
                            prop_type: "string",
                            id: ["P18", "=s3"],
                        },
                    ],
                    xParams: xParams,
                    xVars: xVars,
                    xQueries: xQueries
                });
            })

            it("includes a var declaration for containing a prop for simulating if", () => {

                expect(xVars).to.deep.equal({
                    "g0": {type: 'id_array'},
                    "vg0_p1_a": {type: 'id_array'},
                });
            })

            it('expands queries, including a set with an "if" set query and claim query, also with "if"', () => {

                expect(xQueries).to.deep.equal([
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // query to simulate activating/deactivating prop
                    {
                        type: 'set',// used to be "activate"

                        if: "s2",// used to be bool
                        set: "vg0_p1_a", to: "p1"
                    },
                    // selection props
                    {
                        if: "s4",
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: "s1",
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                        // props
                        props: {
                            entity_ref: ["p0"],
                            string: ["vg0_p1_a"],
                        }
                    },
                ]);
            })

        })

        describe("working with >> selection, + qualifiers + references ->", () => {

            before(() => {

                xParams = {};
                xVars = {};
                xQueries = [];

                xDataSetConfig = expander.expandGroups({
                    cGroups: [
                        {
                            // filter
                            where: { id: ["=s0"] },


                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                },
                                // props
                                props: {
                                    "p0": {
                                        get: {
                                            qualifiers: {
                                                "p1": {if: "=s0"},
                                                "p2": {}
                                            },
                                            references: {
                                                "p1": {if: "=s0"}
                                            },
                                        }
                                    },
                                },
                            },
                        },
                    ],
                    cProps: [
                        {
                            prop_type: "entity_ref",
                            id: ["P1"]
                        },
                        {
                            prop_type: "datetime",
                            id: ["P2"],
                        },
                        {
                            prop_type: "entity_ref",
                            id: ["P3"]
                        },
                    ],
                    xParams: xParams,
                    xVars: xVars,
                    xQueries: xQueries
                });
            })

            it("includes if var declarations for both the qualifiers and references", () => {

                expect(xVars).to.deep.equal({
                    "g0": {type: 'id_array'},
                    "vg0_p0_q_e_p1_a": {type: 'id_array'},
                    "vg0_p0_r_p1_a": {type: 'id_array'},
                });
            })

            it('expands queries, including qualifiers and references sub queries', () => {

                expect(xQueries).to.deep.equal([
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    {
                        type: 'set',

                        if: "s0",
                        set: "vg0_p0_q_e_p1_a", to: "p1"
                    },
                    {
                        type: 'set',

                        if: "s0",
                        set: "vg0_p0_r_p1_a", to: "p1"
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: false,
                            description: false,
                            sitelink: false,
                            class: false,
                        },
                        // props
                        props: {
                            entity_ref: ["p0"],
                        },

                        subs: [
                            {
                                type: "qualifier",

                                prop: "p0",

                                qualifiers: {
                                    datetime: ["vg0_p0_q_e_p1_a"],
                                    entity_ref: ["p2"],
                                },
                            },
                            {
                                type: "reference",

                                prop: "p0",

                                references: {
                                    datetime: ["vg0_p0_r_p1_a"],
                                }
                            },
                        ]
                    },
                ]);
            })

        })

        describe("working with >> other group's value ->", () => {

            before(() => {

                xParams = {};
                xVars = {};
                xQueries = [];

                xDataSetConfig = expander.expandGroups({
                    cGroups: [
                        {
                            // filter
                            where: { id: ["=s0"] },


                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                },
                                // props
                                props: {
                                    "p0": {
                                        get: {
                                            qualifiers: {
                                                "p1": {}
                                            },
                                            references: {
                                                "p1": {}
                                            },
                                        },
                                    }
                                },
                            },
                        },
                        {
                            // filter
                            where: {
                                "p0": {
                                    is: ["=g0_p0"],

                                    where: {
                                        qualifiers: {
                                            "p1": {
                                                is: ["=g0_p0_q_e_p0"]
                                            }
                                        },
                                        references: {
                                            "p1": {
                                                is: ["=g0_p0_r_p1"]
                                            }
                                        },
                                    }
                                },
                            },


                            get: {
                                // identity
                                identities:{

                                },
                                // props
                                props: {

                                },
                            },
                        },
                    ],
                    cProps: [
                        {
                            prop_type: "entity_ref",
                            id: ["P12"]
                        },
                        {
                            prop_type: "datetime",
                            id: ["P22"],
                        },
                    ],
                    xParams: xParams,
                    xVars: xVars,
                    xQueries: xQueries
                });
            })

            it("includes a var declaration for containing a prop for simulating if", () => {

                expect(xVars).to.deep.equal({
                    "g0": {type: 'id_array'},

                    "g0_p0_v": {type: 'id_array'},
                    "g0_p0_q_e_p0_v": {type: 'id_array'},

                    "g0_p0_r_p1_v": {type: 'big_int_array'},// days
                    "g0_p0_r_p1_v4": {type: 'id_array'},// calendar_model_id

                    "g1": {type: 'id_array'},
                });
            })

            it('expands queries, including a set with an "if" set query and claim query, also with "if"', () => {

                expect(xQueries).to.deep.equal([
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
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {
                            "entity_ref": [
                                "p0"
                            ]
                        },
                        "subs": [
                            {
                                "type": "qualifier",
                                "prop": "p0",
                                "qualifiers": {
                                    "datetime": [
                                        "p1"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p0",
                                        "vars": {
                                            "val": "g0_p0_q_e_p0_v"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "reference",
                                "prop": "p0",
                                "references": {
                                    "datetime": [
                                        "p1"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p1",
                                        "vars": {
                                            "val": "g0_p0_r_p1_v",
                                            "val4": "g0_p0_r_p1_v4"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "value_var",
                                "prop": "p0",
                                "vars": {
                                    "val": "g0_p0_v"
                                }
                            }
                        ]
                    },
                    {
                        "group": 1,
                        "type": "props_filter",

                        limit: expander.defaultValues.limit,

                        "subs": [
                            {
                                "table": "entity_ref",
                                "prop": "p0",
                                "exacts": {
                                    "value": [
                                        "g0_p0_v"
                                    ]
                                },
                                "subs": [
                                    {
                                        "table": "datetime",
                                        "prop": "p1",
                                        "ranges": {
                                            "datetime": {
                                                "points": [
                                                    "g0_p0_r_p1_v"
                                                ],
                                                "lower_range": 0,
                                                "upper_range": 0
                                            }
                                        },
                                        "exacts": {
                                            "calendar_model_id": [
                                                "g0_p0_r_p1_v4"
                                            ]
                                        },
                                        "detail_table": "claim_references",
                                        "claim_prefix": "r"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 1,
                        "identities": {
                            "label": false,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {}
                    }
                ]);
            })

        })

    })

    describe("expand()", () => {

        describe("working with >> selection, identity only ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [
                        {type: "id_array"}
                    ],
                    fixed_vars: [],
                    props: [],
                    groups: [
                        {
                            // filter
                            where: { id: ["=s0"] },

                            get: {

                                identities:{
                                    "label": {},
                                    "alias": {},
                                    "sitelink": {},
                                },
                            },
                        },
                    ],
                    names: {
                        settings: ["selection_ids"],
                        fixed_vars: [],
                        props: [],
                        groups: ["selection"]
                    }
                };

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("create hash, params, vars, and queries objects", () => {

                expect(_.keys(xDataSetConfig)).to.deep.equal([
                    "params", "vars", "queries", "hash"
                ]);
            })

            it("expands params to include selection (s0) and and existing group0 members (sg0e)", () => {

                expect(xDataSetConfig.params).to.deep.equal({
                    // selection
                    "s0": {type: 'id_array'},
                    // selection's existing member
                    "sg0e": {type: 'id_array'},
                });
            })

            it("expands vars to include selection (g0)", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    "g0": {type: 'id_array'},
                });
            })

            it("expands queries to include setting selection and gets their properties", () => {

                expect(xDataSetConfig.queries).to.deep.equal([
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                    },
                ]);
            })

        })

        describe("working with >> selection + props ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [
                        {type: "id_array"}
                    ],
                    fixed_vars: [],
                    props: [
                        // conservation_status
                        {
                            prop_type: "entity_ref",
                            id: ["P141"]
                        },
                        // image
                        {
                            prop_type: "string",
                            id: ["P18"],
                        },
                    ],

                    groups: [
                        {
                            // filter
                            where: { id: ["=s0"] },

                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                    "alias": {},
                                    "sitelink": {},
                                },
                                // props
                                props: {
                                    "p0": {}, // conservation_status
                                    "p1": {} // image
                                }
                            },
                        },
                    ],
                    names: {
                        settings: ["selection_ids"],
                        fixed_vars: [],
                        props: ["conservation_status", "image"],
                        groups: ["selection"]
                    }
                }

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("expands props in vars", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    "g0": {type: 'id_array'},
                    "p0": {type: 'id_array'},
                    "p1": {type: 'id_array'},
                });
            })

            it("uses props in the queries", () => {

                expect(xDataSetConfig.queries).to.deep.equal([
                    {
                        type: "set",
                        set: "p0", to: [[1411]]
                    },
                    {
                        type: "set",
                        set: "p1", to: [[181]]
                    },
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // selection props
                    {
                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: true,
                            description: false,
                            sitelink: true,
                            class: false,
                        },

                        props: {
                            entity_ref: ["p0"],
                            string: ["p1"],
                        }
                    },
                ]);
            })

        })

        describe("working with >> selection + props + settings ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [
                        {type: "id_array"},
                        {type: "bool"},
                        {type: "bool"},
                        {type: "id_array"},
                    ],
                    fixed_vars: [],
                    props: [
                        // conservation_status
                        {
                            prop_type: "entity_ref",
                            id: ["P141"]
                        },
                        // image
                        {
                            prop_type: "string",
                            id: ["P18", "=s3"],
                        },
                    ],
                    groups: [
                        {
                            if: "=s4",

                            // filter
                            where: { id: ["=s0"] },

                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                    "alias": {if: "=s1"},
                                    "sitelink": {},
                                },
                                // props
                                props: {
                                    "p0": {}, // conservation_status
                                    "p1": {if: "=s2"} // image
                                }
                            },
                        },
                    ],
                    names: {
                        settings: [
                            "selection_ids",
                            "get_aliases",
                            "get_images",
                            "imagesprops",
                        ],
                        fixed_vars: [],
                        groups: [
                            "selection"
                        ],
                        props: [
                            "conservation_status",
                            "image",
                        ],
                    }
                }

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("expands settings in params", () => {

                expect(xDataSetConfig.params).to.deep.equal({
                    "s0": {type: 'id_array'},
                    "sg0e": {type: 'id_array'},
                    "s1": {type: "bool"},
                    "s2": {type: "bool"},
                    "s3": {type: "id_array"},
                });
            })

            it("expands var to simulate if (vg0_p1_a) vars", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    "g0": {type: 'id_array'},
                    "p0": {type: 'id_array'},
                    "p1": {type: 'id_array'},
                    "vg0_p1_a": {type: 'id_array'},
                });
            })

            it("uses the settings in the queries", () => {

                expect(xDataSetConfig.queries).to.deep.equal([
                    {
                        type: "set",
                        set: "p0", to: [[1411]]
                    },
                    {
                        type: "set",
                        set: "p1", to: [[181], "s3"]
                    },
                    {
                        type: "set",
                        set: "g0", to: ["s0"]
                    },
                    // query to simulate activating/deactivating prop
                    {
                        type: 'set',// used to be "activate"

                        if: "s2",// used to be bool
                        set: "vg0_p1_a", to: "p1"
                    },
                    // selection props
                    {
                        if: "s4",

                        type: 'claim',

                        group: 0,
                        identities: {
                            label: true,
                            alias: "s1",
                            description: false,
                            sitelink: true,
                            class: false,
                        },
                        // props
                        props: {
                            entity_ref: ["p0"],
                            string: ["vg0_p1_a"],
                        }
                    },
                ]);
            })

        })

        describe("working with >> selection, + fixed_vars ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [

                    ],
                    fixed_vars: [
                        {
                            type: "id_array",
                            val: [
                                "Q1",
                                "Q2"
                            ]
                        },
                    ],
                    props: [

                    ],
                    groups: [

                    ],
                    names: {
                        settings: [],
                        fixed_vars: [
                            "landmarks"
                        ],
                        groups: [],
                        props: [],
                    }
                }

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("expands fixed_vars in vars", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    "fv0": {
                        "type": "id_array",
                        "val": [
                            [
                                10,
                                20
                            ]
                        ]
                    }
                });
            })

        })

        describe("working with >> other group's value ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [
                        {type: "id_array"},
                    ],
                    fixed_vars: [],
                    props: [
                        {
                            prop_type: "entity_ref",
                            id: ["P12"]
                        },
                        {
                            prop_type: "datetime",
                            id: ["P22"],
                        },
                    ],
                    groups: [
                        {
                            // filter
                            where: { id: ["=s0"] },


                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                },
                                // props
                                props: {
                                    "p0": {
                                        get: {
                                            qualifiers: {
                                                "p1": {}
                                            },
                                            references: {
                                                "p1": {}
                                            },
                                        },
                                    }
                                },
                            },
                        },
                        {
                            // filter
                            where: {
                                "p0": {
                                    is: ["=g0_p0"],

                                    where: {
                                        qualifiers: {
                                            "p1": {
                                                is: ["=g0_p0_q_e_p0"]
                                            }
                                        },
                                        references: {
                                            "p1": {
                                                is: ["=g0_p0_r_p1"]
                                            }
                                        },
                                    }
                                },
                            },


                            get: {
                                // identity
                                identities:{

                                },
                                // props
                                props: {

                                },
                            },
                        },
                    ],
                    names: {
                        settings: [],
                        fixed_vars: [],
                        groups: [
                            "selection"
                        ],
                        props: [
                            "conservation_status",
                            "point_in_time",
                        ],
                    }
                }

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("expands vars", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    "g0": {type: 'id_array'},

                    "g0_p0_v": {type: 'id_array'},
                    "g0_p0_q_e_p0_v": {type: 'id_array'},

                    "g0_p0_r_p1_v": {type: 'big_int_array'},// days
                    "g0_p0_r_p1_v4": {type: 'id_array'},// calendar_model_id

                    "g1": {type: 'id_array'},

                    "p0": {type: 'id_array'},
                    "p1": {type: 'id_array'},
                });
            })

            it("expands queries", () => {

                expect(xDataSetConfig.queries).to.deep.equal([
                    {
                        "type": "set",
                        "set": "p0",
                        "to": [
                            [
                                121
                            ]
                        ]
                    },
                    {
                        "type": "set",
                        "set": "p1",
                        "to": [
                            [
                                221
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
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {
                            "entity_ref": [
                                "p0"
                            ]
                        },
                        "subs": [
                            {
                                "type": "qualifier",
                                "prop": "p0",
                                "qualifiers": {
                                    "datetime": [
                                        "p1"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p0",
                                        "vars": {
                                            "val": "g0_p0_q_e_p0_v"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "reference",
                                "prop": "p0",
                                "references": {
                                    "datetime": [
                                        "p1"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p1",
                                        "vars": {
                                            "val": "g0_p0_r_p1_v",
                                            "val4": "g0_p0_r_p1_v4"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "value_var",
                                "prop": "p0",
                                "vars": {
                                    "val": "g0_p0_v"
                                }
                            }
                        ]
                    },
                    {
                        "group": 1,
                        "type": "props_filter",

                        limit: expander.defaultValues.limit,

                        "subs": [
                            {
                                "table": "entity_ref",
                                "prop": "p0",
                                "exacts": {
                                    "value": [
                                        "g0_p0_v"
                                    ]
                                },
                                "subs": [
                                    {
                                        "table": "datetime",
                                        "prop": "p1",
                                        "ranges": {
                                            "datetime": {
                                                "points": [
                                                    "g0_p0_r_p1_v"
                                                ],
                                                "lower_range": 0,
                                                "upper_range": 0
                                            }
                                        },
                                        "exacts": {
                                            "calendar_model_id": [
                                                "g0_p0_r_p1_v4"
                                            ]
                                        },
                                        "detail_table": "claim_references",
                                        "claim_prefix": "r"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 1,
                        "identities": {
                            "label": false,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {}
                    }
                ]);
            })

        })

        describe("working with >> everything ->", () => {

            let xDataSetConfig;

            before(() => {
                const dataSetConfig = {
                    settings: [
                        {type: "id_array"},
                        {type: "bool"},
                        {type: "id_array"},
                        {type: "small_int"},
                    ],
                    fixed_vars: [
                        {
                            type: "id_array",
                            val: [
                                "Q1",
                                "Q2"
                            ]
                        },
                    ],
                    props: [
                        {
                            prop_type: "entity_ref",
                            id: ["P12"]
                        },
                        {
                            prop_type: "datetime",
                            id: ["P22"],
                        },
                    ],
                    groups: [
                        {
                            // filter
                            where: { id: ["=s0"] },

                            if: "=s1",


                            get: {
                                // identity
                                identities:{
                                    "label": {},
                                    "alias": {if: "=s1"}
                                },
                                // props
                                props: {
                                    "p0": {
                                        if: "=s1",
                                        get: {
                                            qualifiers: {
                                                "p1": {if: "=s1"}
                                            },
                                            references: {
                                                "p1": {}
                                            },
                                        },
                                    }
                                },
                            },

                            orderings: [
                                { order_by: "=p1", order: "DESC"},
                                { order_by: "=p0"},
                            ],
                            limit: 100,
                            offset: "=s3"
                        },
                        {
                            // filter
                            where: {
                                "p0": {
                                    is: ["=g0_p0"],

                                    where: {
                                        qualifiers: {
                                            "p1": {
                                                is: ["=g0_p0_q_e_p0"]
                                            }
                                        },
                                        references: {
                                            "p1": {
                                                is: ["=g0_p0_r_p1"]
                                            }
                                        },
                                    }
                                },
                            },


                            get: {
                                identities:{},
                                props: {},
                            },
                        },
                        {
                            // filter
                            where: {
                                class: ["=s2"]
                            },

                            get: {
                                identities:{},
                                props: {},
                            },
                        },
                        {
                            // filter
                            where: {
                                connected: {
                                    to: ["=g0"],

                                    up_props: ["=p0"],
                                    down_props: ["=p0"],

                                    up_depth: 1,
                                    down_depth: 2,
                                    cousin_depth: 1
                                }
                            },

                            get: {
                                identities:{},
                                props: {},
                            },
                        },
                    ],
                    names: {
                        settings: [],
                        fixed_vars: [],
                        groups: [
                            "selection"
                        ],
                        props: [
                            "conservation_status",
                            "point_in_time",
                        ],
                    }
                }

                xDataSetConfig = expander.expand(dataSetConfig);
            })

            it("creates hash", () => {
                expect(xDataSetConfig.hash).to.match(/i_f_([0-9]|[a-z]){40}/);
            })

            it("expands settings in params", () => {

                expect(xDataSetConfig.params).to.deep.equal({
                    "s0": {
                        "type": "id_array"
                    },
                    "s1": {
                        "type": "bool"
                    },
                    "s2": {
                        "type": "id_array"
                    },
                    "s3": {
                        "type": "small_int"
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
                    "sg3e": {
                        "type": "id_array"
                    }
                });
            })

            it("expands vars", () => {

                expect(xDataSetConfig.vars).to.deep.equal({
                    // groups
                    "g0": {
                        "type": "id_array"
                    },
                    "g1": {
                        "type": "id_array"
                    },
                    "g2": {
                        "type": "id_array"
                    },
                    "g3": {
                        "type": "id_array"
                    },

                    // fixed_vars
                    "fv0": {
                        "type": "id_array",
                        "val": [
                            [
                                10,
                                20
                            ]
                        ]
                    },

                    // props
                    "p0": {
                        "type": "id_array"
                    },
                    "p1": {
                        "type": "id_array"
                    },
                    // props' if
                    "vg0_p0_a": {
                        "type": "id_array"
                    },
                    "vg0_p0_q_e_p1_a": {
                        "type": "id_array"
                    },

                    // groupValue
                    "g0_p0_v": {
                        "type": "id_array"
                    },
                    "g0_p0_q_e_p0_v": {
                        "type": "id_array"
                    },

                    "g0_p0_r_p1_v": {
                        "type": "big_int_array"
                    },
                    "g0_p0_r_p1_v4": {
                        "type": "id_array"
                    }
                });
            })

            it("expands queries", () => {

                expect(xDataSetConfig.queries).to.deep.equal([
                    {
                        "type": "set",
                        "set": "p0",
                        "to": [[121]]
                    },
                    {
                        "type": "set",
                        "set": "p1",
                        "to": [[221]]
                    },
                    // set
                    {
                        "type": "set",
                        "set": "g0",
                        "to": ["s0"]
                    },
                    // set
                    {
                        "type": "set",
                        "if": "s1",
                        "set": "vg0_p0_a",
                        "to": "p0"
                    },
                    // set
                    {
                        "type": "set",
                        "if": "s1",
                        "set": "vg0_p0_q_e_p1_a",
                        "to": "p1"
                    },
                    // claim
                    {
                        "type": "claim",
                        "group": 0,
                        "identities": {
                            "label": true,
                            "alias": "s1",
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {
                            "entity_ref": [
                                "vg0_p0_a"
                            ]
                        },
                        "subs": [
                            {
                                "type": "qualifier",
                                "prop": "p0",
                                "qualifiers": {
                                    "datetime": [
                                        "vg0_p0_q_e_p1_a"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p0",
                                        "vars": {
                                            "val": "g0_p0_q_e_p0_v"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "reference",
                                "prop": "p0",
                                "references": {
                                    "datetime": [
                                        "p1"
                                    ]
                                },
                                "subs": [
                                    {
                                        "type": "value_var",
                                        "prop": "p1",
                                        "vars": {
                                            "val": "g0_p0_r_p1_v",
                                            "val4": "g0_p0_r_p1_v4"
                                        }
                                    }
                                ]
                            },
                            {
                                "type": "value_var",
                                "prop": "p0",
                                "vars": {
                                    "val": "g0_p0_v"
                                }
                            }
                        ],
                        "if": "s1"
                    },
                    {
                        "group": 1,
                        "type": "props_filter",

                        limit: expander.defaultValues.limit,

                        "subs": [
                            {
                                "table": "entity_ref",
                                "prop": "p0",
                                "exacts": {
                                    "value": [
                                        "g0_p0_v"
                                    ]
                                },
                                "subs": [
                                    {
                                        "table": "datetime",
                                        "prop": "p1",
                                        "ranges": {
                                            "datetime": {
                                                "points": [
                                                    "g0_p0_r_p1_v"
                                                ],
                                                "lower_range": 0,
                                                "upper_range": 0
                                            }
                                        },
                                        "exacts": {
                                            "calendar_model_id": [
                                                "g0_p0_r_p1_v4"
                                            ]
                                        },
                                        "detail_table": "claim_references",
                                        "claim_prefix": "r"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 1,
                        "identities": {
                            "label": false,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {}
                    },
                    {
                        "group": 2,
                        "type": "class_filter",

                        limit: expander.defaultValues.limit,

                        "class": [
                            "s2"
                        ]
                    },
                    {
                        "type": "claim",
                        "group": 2,
                        "identities": {
                            "label": false,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {}
                    },
                    {
                        "group": 3,
                        "type": "connected_to_filter",

                        limit: expander.defaultValues.limit,

                        "entities": [
                            "g0"
                        ],
                        "up_props": [
                            "p0"
                        ],
                        "down_props": [
                            "p0"
                        ],
                        "up_depth": 1,
                        "down_depth": 2,
                        "cousin_depth": 1
                    },
                    {
                        "type": "claim",
                        "group": 3,
                        "identities": {
                            "label": false,
                            "alias": false,
                            "description": false,
                            "sitelink": false,
                            "class": false
                        },
                        "props": {}
                    }
                ]);
            })

        })

        describe("working with >> actual functions", () => {

            describe("taxonomy ->", () => {

                let xDataSetConfig;

                before(() => {

                    // taxonomy
                    const dataSetConfig = {
                        names: {
                            settings: [
                                "selection",// 0

                                "get_aliases",// 1
                                "get_description",// 2
                                "get_image",// 3
                                "get_conservation_status",// 4

                                "taxonomy.up_depth",// 5
                                "taxonomy.down_depth",// 6
                            ],
                            fixed_vars: [
                                "cousin_depth"
                            ],
                            props: [
                                "parent_taxon",// 0
                                "rank",// 1
                                "image",// 2
                                "conservation_status",// 3
                                "taxon_name",// 4
                            ],
                            groups: [
                                "selection",
                                "taxonomy",
                            ],
                        },
                        settings: [
                            {type: "id_array"},// selection

                            {type: "bool"},// get_aliases
                            {type: "bool"},// get_description
                            {type: "bool"},// get_image
                            {type: "bool"},// get_conservation_status

                            {type: "small_int"},// taxonomy.up_depth
                            {type: "small_int"},// taxonomy.down_depth
                        ],
                        fixed_vars: [
                            {
                                type: "small_int",// cousin_depth
                                val: 1
                            },
                        ],
                        props: [
                            {
                                prop_type: "entity_ref",// parent_taxon
                                id: ["P171"]
                            },
                            {
                                prop_type: "entity_ref",// rank
                                id: ["P105"]
                            },
                            {
                                prop_type: "string",// image
                                id: ["P18"]
                            },
                            {
                                prop_type: "entity_ref",// conservation_status
                                id: ["P141"],
                            },
                            {
                                prop_type: "string",// taxon_name
                                id: ["P225"],
                            },
                        ],
                        groups: [
                            // selection
                            {
                                // filter
                                where: { id: ["=s0"] },

                                get: {
                                    // identity
                                    identities:{
                                        "label": {},
                                        "alias": {if: "=s1"},
                                        "description": {},
                                        "sitelink": {},
                                    },
                                    // props
                                    props: {
                                        "p0": {},
                                        "p1": {},
                                        "p2": {
                                            if: "=s1",
                                        },
                                        "p3": {},
                                        "p4": {},
                                    },
                                },
                            },
                            // taxonomy
                            {
                                // filter
                                where: {
                                    connected: {
                                        to: ["=g0"],

                                        up_props: ["=p0"],
                                        down_props: [],

                                        up_depth: "=s5",
                                        down_depth: "=s6",
                                        cousin_depth: "=fv0"
                                    }
                                },

                                get: {
                                    identities: {
                                        "label": {},
                                        "alias": {if: "=s1"},
                                        "description": {if: "=s2"},
                                        "sitelink": {},
                                    },
                                    props: {
                                        "p0": {},
                                        "p1": {},
                                        "p2": {
                                            if: "=s3",
                                        },
                                        "p3": {
                                            if: "=s4",
                                        },
                                        "p4": {},
                                    },
                                },
                            },
                        ],
                    }

                    xDataSetConfig = expander.expand(dataSetConfig);
                })

                it("expands settings in params", () => {

                    expect(xDataSetConfig.params).to.deep.equal({
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
                    });
                })

                it("expands vars", () => {

                    expect(xDataSetConfig.vars).to.deep.equal({
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
                    });
                })

                it("expands queries", () => {

                    expect(xDataSetConfig.queries).to.deep.equal([
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
                    ]);
                })

            })

            describe("taxonomy ranks ->", () => {

                let xDataSetConfig;

                before(() => {

                    // taxonomy
                    const dataSetConfig = {
                        names: {
                            settings: [],
                            fixed_vars: [
                                "taxonomic_rank"
                            ],
                            props: [
                                "part_of",// 0
                            ],
                            groups: [
                                "taxonomic_rank",
                            ],
                        },
                        settings: [],
                        fixed_vars: [
                            {
                                type: "id_array",// taxonomic_rank
                                val: ["Q427626"]
                            },
                        ],
                        props: [
                            {
                                prop_type: "entity_ref",// part_of
                                id: ["P361"]
                            },
                        ],
                        groups: [
                            // ranks
                            {
                                // filter
                                where: { class: ["=fv0"] },

                                get: {
                                    // identity
                                    identities:{
                                        "label": {},
                                        "alias": {},
                                    },
                                    // props
                                    props: {
                                        "p0": {},
                                    },
                                },
                            },
                        ],
                    }

                    xDataSetConfig = expander.expand(dataSetConfig);
                })

                it("expands settings in params", () => {

                    expect(xDataSetConfig.params).to.deep.equal({
                        "sg0e": {
                            "type": "id_array"
                        },
                    });
                })

                it("expands vars", () => {

                    expect(xDataSetConfig.vars).to.deep.equal({
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
                    });
                })

                it("expands queries", () => {

                    expect(xDataSetConfig.queries).to.deep.equal([
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
                    ]);
                })

            })

            describe("connected, part of same theme, and adjacent events ->", () => {

                let xDataSetConfig;

                before(() => {

                    // taxonomy
                    const dataSetConfig = {
                        names: {
                            settings: [
                                "selection",// 0

                                "get_series",// 1
                                "get_connected",// 2
                                "get_adjacent",// 3

                                "get_aliases",// 4
                                "get_description",// 5
                                "get_image",// 6

                                "time_range.before",// 7
                                "time_range.after",// 8
                            ],
                            fixed_vars: [
                                "causality_depth"
                            ],
                            props: [
                                "part_of",// 0
                                "series",// 1
                                "topic_main_category",// 1

                                "participant",// 2

                                "location",// 3
                                "country",// 4

                                "has_cause",// 5
                                "cause_of",// 6

                                "has_immediate_cause",// 7
                                "immediate_cause_of",// 8

                                "follows",// 9
                                "followed_by",// 10

                                "image",// 11
                                "flag_image",// 12

                                "number_of_deaths",// 13

                                "coordinate_location",// 14

                                "point_in_time",// 15
                                "start_time",// 16
                                "end_time",// 17
                            ],
                            groups: [
                                "selection",

                                "series_event",
                                "adjacent_event",
                                "connected_event",

                                "location"
                            ],
                        },
                        settings: [
                            {type: "id_array"},

                            {type: "bool"},
                            {type: "bool"},
                            {type: "bool"},

                            {type: "bool"},
                            {type: "bool"},
                            {type: "bool"},

                            {type: "bigint"},
                            {type: "bigint"},
                        ],
                        fixed_vars: [
                            {
                                type: "small_int",// causality_depth
                                val: 1
                            },
                        ],
                        props: [
                            {
                                prop_type: "entity_ref",// part_of
                                id: ["P361"]
                            },
                            {
                                prop_type: "entity_ref",// series
                                id: ["P179"]
                            },


                            {
                                prop_type: "entity_ref",// participant
                                id: ["P710"]
                            },


                            {
                                prop_type: "entity_ref",// location
                                id: ["P276"]
                            },
                            {
                                prop_type: "entity_ref",// country
                                id: ["P17"]
                            },


                            {
                                prop_type: "entity_ref",// has_cause
                                id: ["P828"]
                            },
                            {
                                prop_type: "entity_ref",// cause_of
                                id: ["P1452"]
                            },


                            {
                                prop_type: "entity_ref",// has_immediate_cause
                                id: ["P1478"]
                            },
                            {
                                prop_type: "entity_ref",// immediate_cause_of
                                id: ["P1536"]
                            },


                            {
                                prop_type: "entity_ref",// follows
                                id: ["P155"]
                            },
                            {
                                prop_type: "entity_ref",// followed_by
                                id: ["P156"]
                            },


                            {
                                prop_type: "string",// image
                                id: ["P18"]
                            },
                            {
                                prop_type: "entity_ref",// flag_image
                                id: ["P41"]
                            },


                            {
                                prop_type: "quantity",// number_of_deaths
                                id: ["P1120"]
                            },


                            {
                                prop_type: "globe_coords",// coordinate_location
                                id: ["P625"]
                            },


                            {
                                prop_type: "datetime",// point_in_time
                                id: ["P585"]
                            },
                            {
                                prop_type: "datetime",// start_time
                                id: ["P580"]
                            },
                            {
                                prop_type: "datetime",// end_time
                                id: ["P582"]
                            },
                        ],
                        groups: [
                            // selection
                            {
                                // filter
                                where: { id: ["=s0"] },

                                get: {
                                    // identity
                                    identities:{
                                        "label": {},
                                        "alias": {},
                                        "description": {},
                                        "sitelink": {},
                                        "class": {}
                                    },
                                    // props
                                    props: {
                                        "p0": {}, "p1": {},// part_of, series
                                        "p2": {},// participant
                                        "p3": {}, "p4": {},// location, country
                                        "p5": {}, "p6": {},// has_cause, cause_of
                                        "p7": {}, "p8": {},// has_immediate_cause, immediate_cause_of
                                        "p9": {}, "p10": {},// follows, followed_by
                                        "p11": {},// image
                                        "p13": {},// number_of_deaths
                                        "p14": {},// coordinate_location
                                        "p15": {}, "p16": {}, "p17": {},// point_in_time, start_time, end_time
                                    },
                                },
                            },
                            // series_event
                            {
                                if: "=s1",

                                // filter
                                where: {
                                    connected: {
                                        to: ["=g0"],

                                        up_props: ["=p0"],
                                        down_props: ["=p1"],

                                        up_depth: "=fv0",
                                        down_depth: "=fv0",
                                        cousin_depth: "=fv0"
                                    }
                                },

                                get: {
                                    // identity
                                    identities: {
                                        "label": {},
                                        "alias": {if:"=s4"},
                                        "description": {if:"=s5"},
                                        "sitelink": {},
                                        "class": {}
                                    },
                                    // props
                                    props: {
                                        "p0": {}, "p1": {},// part_of, series
                                        "p2": {},// participant
                                        "p3": {}, "p4": {},// location, country
                                        "p11": {if:"=s6"},// image
                                        "p13": {},// number_of_deaths
                                        "p14": {},// coordinate_location
                                        "p15": {}, "p16": {}, "p17": {},// point_in_time, start_time, end_time
                                    },
                                },
                            },
                            // adjacent_event

                            // connected_event

                            // location
                            {
                                // filter
                                where: {
                                    id: [
                                        "=g0_p3", "=g0_p4",
                                    ]
                                },

                                get: {
                                    // identity
                                    identities: {
                                        "label": {}
                                    },
                                    // props
                                    props: {
                                        "p12": {},// flag_image
                                        "p14": {},// coordinate_location
                                    },
                                },
                            },
                        ],
                    }

                    xDataSetConfig = expander.expand(dataSetConfig);
                })

                it("expands settings in params", () => {

                    expect(xDataSetConfig.params).to.deep.equal({
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
                            "type": "bigint"
                        },
                        "s8": {
                            "type": "bigint"
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
                    });
                })

                it("expands vars", () => {

                    expect(xDataSetConfig.vars).to.deep.equal({
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
                    });
                })

                it("expands queries", () => {

                    expect(xDataSetConfig.queries).to.deep.equal([
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
                                "g0_p3_v",
                                "g0_p4_v"
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
                    ]);
                })

            })
            
        })
        // difference ^?
        // newer version
        let all = {
            props: {
                "biome": {
                    type: "entity_ref",
                    id: ["P123"]
                },
                "conservation_status": {
                    type: "entity_ref",
                    id: ["P141"]
                },
                "image": {
                    type: "string",
                    id: [
                        "P18",
                        "=settings.other_image_propids"
                    ],
                },
                "parent_taxon": {
                    type: "entity_ref",
                    id: ["P171"]
                },
                "start_time": {
                    type: "datetime",
                    id: ["P123"]
                },
                "taxonomic_rank": {
                    type: "entity_ref",
                    id: []
                }
            },

            groups: {
                "selection": {
                    if: "=s0",
                    // filter
                    where: { id: "=settings.selection" },

                    get: {
                        // identity
                        "label": {}, "alias": {},
                        "_description": { if: "=settings.get_description" },
                        "class": {},

                        // property
                        "conservation_status": {},
                        "biome": {},
                        "location": {},
                        "image": {},
                        "population": {
                            get: {
                                qualifiers_of_entity: {
                                    "point_in_time": {}
                                }
                            }
                        },
                    }
                },
                "taxon": {
                    // filter
                    where: {
                        _connected: {
                            _to: "=selection",

                            upprops: ["parent_taxon", "parent_taxon2"],

                            up_depth: "=settings.taxonomy.up_depth",
                            down_depth: "=settings.taxonomy.down_depth",
                            cousin_depth: 1
                        },
                    },
                    get: {
                        // identity
                        "label": {},

                        // property
                        "conservation_status": {},
                        "biome": {},
                        "location": {},
                        "image": {},
                        "population": {
                            get: {
                                qualifiers_of_entity: {
                                    "location": {},
                                    "point_in_time": {},
                                }
                            }
                        },
                    },
                },

                "rank": {
                    // filter
                    where: {
                        class: { is: "taxonomic_rank" }
                    },
                    get: {
                        // identity
                        "label": {}
                    },
                },
                "location": {
                    if: "=settings.get_location",

                    // filter
                    where: {
                        id: "=selection.location",
                    },
                    get: {
                        // identity
                        "label": {},
                        // property
                        "map_color": {}
                    },
                },

                "possible_region": {
                    // filter
                    where: {
                        "biome": { is: "=selection.biome",

                            where: {
                                qualifiers_of_entity: {
                                    "end_time": { is: null }
                                },
                                references: {
                                    "source": { is: "=settings.credible_sources" },
                                },
                            },

                            if: "=settings.get_biome",
                        },

                        order_by: "biome",
                        order: "ASC",
                        limit: 100,
                        skip: "=settings.skip_regions"
                    },
                    get: {
                        // identity
                        "label": {},
                        // props
                        "coords": {},
                        "biome": {}
                    }
                },
            }
        }
        const rawConfig = `
            fixed_vars
                landmarks (id_array)
                    Q1
                    Q2

                landmark_locations (globe_coords_array)
                    10, 20
                    30, 40

                landmark_events (datetime_array)
                    1944-11-3
                    1944-11-13
            props
                biome (entity_ref)
                    P123

                conservation_status (entity_ref)
                    P141

                image (string)
                    P18
                    =settings.other_image_propids

                parent_taxon (entity_ref)
                    P171

                start_time (datetime)
                    P123

                taxonomic_rank (entity_ref)
                    =settings.taxonomic_rank_propids

            on_load
                url
                    custom_data/get_world_1102.php
                        params
                        {
                            countries: =selection,
                        }

            on_update

                selection
                    // filter
                    where
                        id
                            =groups.selection

                    get
                        // identity
                        label
                        alias
                        description
                            if
                                =settings.get_description
                        class

                        // property
                        =conservation_status
                        =biome
                        =location
                        =image
                        =population
                            get
                                qualifiers
                                    =point_in_time

                taxon
                    // filter
                    where
                        connected
                            to
                                =groups.selection

                            upprops
                                =parent_taxon
                                =parent_taxon2

                            up_depth
                                =settings.taxonomy.up_depth
                            down_depth
                                =settings.taxonomy.down_depth
                            cousin_depth 1

                    get
                        // identity
                        label

                        // property
                        =conservation_status
                        =biome
                        =location
                        =image
                        =population
                            get
                                qualifiers
                                    =location
                                    =point_in_time

                rank
                    // filter
                    where
                        class
                            is
                                =taxonomic_rank

                    get
                        // identity
                        label

                location
                    // filter
                    where
                        id
                            =groups.selection.location
                        if
                            =settings.get_location

                    get
                        // identity
                        label
                        // property
                        =map_color

                possible_region

                    if
                        =settings.get_possible_region

                    // filter
                    where
                        =biome
                            is
                                =groups.selection.biome

                            where
                                qualifiers
                                    =some_prop
                                        is
                                            =selection.biome.qualifier.point_in_time

                                references
                                    =source
                                        is
                                            =settings.credible_sources

                        order_by
                            biome in ascending order
                            biome.qualifiers.point_in_time in descending order

                        limit
                            100
                        offset_by
                            =settings.skip_regions

                    get
                        // identity
                        label
                        // props
                        =coords
                        =biome
                            if
                                =settings.get_biome


        `;

    })

})
