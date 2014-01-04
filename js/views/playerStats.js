/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            season: req.params.season === "career" ? null : helpers.validateSeason(req.params.season)
        };
    }

    function InitViewModel() {
        this.season = ko.observable();
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayers(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.season !== vm.season()) {
            deferred = $.Deferred();

            g.dbl.transaction("players").objectStore("players").getAll().onsuccess = function (event) {
                var players;

                players = player.filter(event.target.result, {
                    attrs: ["pid", "name", "pos", "age", "injury", "tid", "hof"],
                    ratings: ["skills"],
                    stats: ["abbrev", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa"],
                    season: inputs.season // If null, then show career stats!
                });

                deferred.resolve({
                    season: inputs.season,
                    players: players
                });
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            var label;

            label = vm.season() !== null ? vm.season() : "Career Totals";
            ui.title("Player Stats - " + label);
        }).extend({throttle: 1});

        ko.computed(function () {
            var season;
            season = vm.season();
            ui.datatable($("#player-stats"), 2, _.map(vm.players(), function (p) {
                var abbrev, row;

                // HACK to show right stats
                if (vm.season() === null) {
                    p.stats = p.careerStats;
                    abbrev = helpers.getAbbrev(p.tid);
                } else {
                    abbrev = p.stats.abbrev;
                }

                row = [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, 1), helpers.round(p.stats.fg, 1), helpers.round(p.stats.fga, 1), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, 1), helpers.round(p.stats.tpa, 1), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, 1), helpers.round(p.stats.fta, 1), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, 1), helpers.round(p.stats.drb, 1), helpers.round(p.stats.trb, 1), helpers.round(p.stats.ast, 1), helpers.round(p.stats.tov, 1), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, 1), helpers.round(p.stats.pf, 1), helpers.round(p.stats.pts, 1), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1), p.hof];

                return row;
            }), {
                fnRowCallback: function (nRow, aData) {
                    // Highlight HOF players
                    if (aData[aData.length - 1]) {
                        nRow.classList.add("danger");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#player-stats"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("player-stats-dropdown", ["seasonsAndCareer"], [vm.season()], updateEvents);
    }

    return bbgmView.init({
        id: "playerStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});