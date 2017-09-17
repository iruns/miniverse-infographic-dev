// testee
import * as expander from '../../src/RawDataSetConfigConverter';

// utils
import _ from 'lodash';

// chai
import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from "sinon-chai";

chai.use(sinonChai);

/*
npm test -- --grep "RawDataSetConfigConverter"
*/

describe("RawDataSetConfigConverter ->", () => {

    describe("expand()", () => {

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
