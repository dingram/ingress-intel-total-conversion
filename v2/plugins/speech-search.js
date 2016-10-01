// Give the search input the speech attribute
$("#search").attr("x-webkit-speech", "");
// Immediately search without further input
$("#search").bind("webkitspeechchange", function() {
    $("#search").trigger($.Event("keypress", {keyCode: 13}));
});
