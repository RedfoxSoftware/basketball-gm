/**
 * @name test.core.team
 * @namespace Tests for core.team.
 */
define(["dao", "db", "globals", "core/league", "core/player", "core/team"], function (dao, db, g, league, player, team) {
    "use strict";

    describe("core/team", function () {
        describe("#filter()", function () {
            before(function () {
                return db.connectMeta().then(function () {
                    return league.create("Test", 0, undefined, 2013, false);
                }).then(function () {
                    return dao.teams.get({key: 4}).then(function (t) {
                        t.stats[0].gp = 10;
                        t.stats[0].fg = 50;
                        t.stats[0].fga = 100;
                        t = team.addStatsRow(t, true);
                        t.stats[1].gp = 4;
                        t.stats[1].fg = 12;
                        t.stats[1].fga = 120;

                        return dao.teams.put({value: t});
                    });
                });
            });
            after(function () {
                return league.remove(g.lid);
            });

            it("should return requested info if tid/season match", function () {
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won", "payroll"],
                    stats: ["gp", "fg", "fgp"],
                    tid: 4,
                    season: g.season
                }).then(function (t) {
                    t.tid.should.equal(4);
                    t.abbrev.should.equal("CIN");
                    t.season.should.equal(g.season);
                    t.won.should.equal(0);
                    t.payroll.should.be.gt(0);
                    t.gp.should.equal(10);
                    t.fg.should.equal(5);
                    t.fgp.should.equal(50);
                    Object.keys(t).should.have.length(8);
                    t.hasOwnProperty("stats").should.equal(false);
                });
            });
            it("should return an array if no team ID is specified", function () {
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    stats: ["gp", "fg", "fgp"],
                    season: g.season
                }).then(function (teams) {
                    teams.should.have.length(g.numTeams);
                    teams[4].tid.should.equal(4);
                    teams[4].abbrev.should.equal("CIN");
                    teams[4].season.should.equal(g.season);
                    teams[4].won.should.equal(0);
                    teams[4].gp.should.equal(10);
                    teams[4].fg.should.equal(5);
                    teams[4].fgp.should.equal(50);
                    Object.keys(teams[4]).should.have.length(7);
                    teams[4].hasOwnProperty("stats").should.equal(false);
                });
            });
            it("should return requested info if tid/season match, even when no attrs requested", function () {
                return team.filter({
                    seasonAttrs: ["season", "won"],
                    stats: ["gp", "fg", "fgp"],
                    tid: 4,
                    season: g.season
                }).then(function (t) {
                    t.season.should.equal(g.season);
                    t.won.should.equal(0);
                    t.gp.should.equal(10);
                    t.fg.should.equal(5);
                    t.fgp.should.equal(50);
                    Object.keys(t).should.have.length(5);
                });
            });
            it("should return requested info if tid/season match, even when no seasonAttrs requested", function () {
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    stats: ["gp", "fg", "fgp"],
                    tid: 4,
                    season: g.season
                }).then(function (t) {
                    t.tid.should.equal(4);
                    t.abbrev.should.equal("CIN");
                    t.gp.should.equal(10);
                    t.fg.should.equal(5);
                    t.fgp.should.equal(50);
                    Object.keys(t).should.have.length(5);
                });
            });
            it("should return requested info if tid/season match, even when no stats requested", function () {
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    tid: 4,
                    season: g.season
                }).then(function (t) {
                    t.tid.should.equal(4);
                    t.abbrev.should.equal("CIN");
                    t.season.should.equal(g.season);
                    t.won.should.equal(0);
                    Object.keys(t).should.have.length(4);
                });
            });
            it("should return season totals is options.totals is true", function () {
                return team.filter({
                    stats: ["gp", "fg", "fga", "fgp"],
                    tid: 4,
                    season: g.season,
                    totals: true
                }).then(function (t) {
                    t.gp.should.equal(10);
                    t.fg.should.equal(50);
                    t.fga.should.equal(100);
                    t.fgp.should.equal(50);
                });
            });
            it("should return playoff stats if options.playoffs is true", function () {
                return team.filter({
                    stats: ["gp", "fg", "fga", "fgp"],
                    tid: 4,
                    season: g.season,
                    playoffs: true
                }).then(function (t) {
                    t.gp.should.equal(4);
                    t.fg.should.equal(3);
                    t.fga.should.equal(30);
                    t.fgp.should.equal(10);
                });
            });
            it("should use supplied IndexedDB transaction", function () {
                var tx = dao.tx(["players", "releasedPlayers", "teams"]);
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    tid: 4,
                    season: g.season,
                    ot: tx
                }).then(function (t) {
                    t.tid.should.equal(4);
                    t.abbrev.should.equal("CIN");
                    t.season.should.equal(g.season);
                    t.won.should.equal(0);
                    Object.keys(t).should.have.length(4);

                    // If another transaction was used inside team.filter besides tx, this will cause an error because the transaction will no longer be active
                    return dao.players.get({ot: tx, key: 0});
                });
            });
            it("should return stats in an array if no season is specified", function () {
                return team.filter({
                    stats: ["gp", "fg", "fga", "fgp"],
                    tid: 4,
                    playoffs: true
                }).then(function (t) {
                    t.stats[0].gp.should.equal(4);
                    t.stats[0].fg.should.equal(3);
                    t.stats[0].fga.should.equal(30);
                    t.stats[0].fgp.should.equal(10);
                });
            });
        });

/*        describe("#checkRosterSizes()", function () {
            before(function () {
                return db.connectMeta().then(function () {
                    return league.create("Test", 0, undefined, 2013, false);
                });
            });
            after(function () {
                return league.remove(g.lid);
            });

            function addTen(tid, cb) {
                var i, tx;

                tx = dao.tx("players", "readwrite");
                i = 0;

                tx.objectStore("players").index("tid").openCursor(g.PLAYER.FREE_AGENT).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;
                    p.tid = tid;
                    cursor.update(p);
                    i += 1;
                    if (i < 10) {
                        cursor.continue();
                    }
                };

                tx.complete().then(function () {
                    cb();
                };
            }

            function removeTen(tid, cb) {
                var i, tx;

                tx = dao.tx(["players", "releasedPlayers", "teams"], "readwrite");
                i = 0;

                tx.objectStore("players").index("tid").openCursor(tid).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;
                    player.release(tx, p, false);
                    i += 1;
                    if (i < 10) {
                        cursor.continue();
                    }
                };

                tx.complete().then(function () {
                    cb();
                };
            }

            it("should add players to AI team under roster limit without returning error message", function (done) {
                removeTen(5, function () {
                    // Confirm roster size under limit
                    g.dbl.transaction("players").objectStore("players").index("tid").count(5).onsuccess = function (event) {
                        event.target.result.should.equal(4);

                        // Confirm players added up to limit
                        team.checkRosterSizes(function (userTeamSizeError) {
                            should.equal(userTeamSizeError, null);
                            g.dbl.transaction("players").objectStore("players").index("tid").count(5).onsuccess = function (event) {
                                event.target.result.should.equal(g.minRosterSize);
                                done();
                            };
                        });
                    };
                });
            });
            it("should remove players to AI team over roster limit without returning error message FAILS SOMETIMES IN CHROME, I THINK IT'S A BUG IN CHROME", function (done) {
                addTen(8, function () {
                    // Confirm roster size over limit
                    g.dbl.transaction("players").objectStore("players").index("tid").count(8).onsuccess = function (event) {
                        event.target.result.should.equal(24);

                        // Confirm roster size pruned to limit
                        team.checkRosterSizes(function (userTeamSizeError) {
                            should.equal(userTeamSizeError, null);
                            // Without setTimeout, Chrome sometimes produces an error (16 instead of 15). I think it's a Chrome bug.
                            setTimeout(function () {
                                g.dbl.transaction("players").objectStore("players").index("tid").count(8).onsuccess = function (event) {
                                    event.target.result.should.equal(15);
                                    done();
                                };
                            }, 1000);
                        });
                    };
                });
            });
            it("should return error message when user team is under roster limit", function (done) {
                removeTen(g.userTid, function () {
                    // Confirm roster size over limit
                    g.dbl.transaction("players").objectStore("players").index("tid").count(g.userTid).onsuccess = function (event) {
                        event.target.result.should.equal(4);

                        // Confirm roster size pruned to limit
                        team.checkRosterSizes(function (userTeamSizeError) {
                            userTeamSizeError.should.be.a("string");
                            userTeamSizeError.should.contain("less");
                            userTeamSizeError.should.contain("minimum");
                            g.dbl.transaction("players").objectStore("players").index("tid").count(g.userTid).onsuccess = function (event) {
                                event.target.result.should.equal(4);
                                done();
                            };
                        });
                    };
                });
            });
            it("should return error message when user team is over roster limit", function (done) {
                addTen(g.userTid, function () {
                    addTen(g.userTid, function () {
                        // Confirm roster size over limit
                        g.dbl.transaction("players").objectStore("players").index("tid").count(g.userTid).onsuccess = function (event) {
                            event.target.result.should.equal(24);

                            // Confirm roster size pruned to limit
                            team.checkRosterSizes(function (userTeamSizeError) {
                                userTeamSizeError.should.be.a("string");
                                userTeamSizeError.should.contain("more");
                                userTeamSizeError.should.contain("maximum");
                                g.dbl.transaction("players").objectStore("players").index("tid").count(g.userTid).onsuccess = function (event) {
                                    event.target.result.should.equal(24);
                                    done();
                                };
                            });
                        };
                    });
                });
            });
        });*/
    });
});