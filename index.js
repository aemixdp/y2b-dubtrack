// ----------------------------------------------------------------------------------------
//                               GAPI INTEGREYSHN BULSHIT
// ----------------------------------------------------------------------------------------

var CLIENT_ID = "660364874627-p3i20auept4737fae3eft7dj97i8s7bq.apps.googleusercontent.com";
var API_KEY = "AIzaSyBu3rzz8M_mZSpz_7xPP8SDTxN2yFAe-t4";
var SCOPES = "https://www.googleapis.com/auth/youtube";
var loadClient;

function clientLoader () {
    var deferred = $.Deferred();
    gapi.client.load("youtube", "v3", function() {
        deferred.resolve();
    });
    return deferred;
}

function checkAuth () {
    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: true
    }, handleAuthResult);
}

function handleAuthResult (authResult) {
    if (authResult && !authResult.error) {
        $("#authorize").prop("disabled", true);
        $("#playlist, #generate").prop("disabled", false);
    } else {
        $("#authorize")
            .prop("disabled", false)
            .click(handleAuthClick);
        $("#playlist, #generate").prop("disabled", true);
    }
}

function handleAuthClick (event) {
    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: false
    }, handleAuthResult);
    return false;
}

function handleClientLoad () {
    loadClient = clientLoader();
    gapi.client.setApiKey(API_KEY);
    window.setTimeout(checkAuth, 1);
}

// ----------------------------------------------------------------------------------------

var IMPORT_CODE_TEMPLATE = "(" + (function () {
    var title = "TITLE";
    var traxx = TRACK_IDS;
    var songs_url;
    $.post("https://api.dubtrack.fm/playlist", {name: title}, function (response) {
        songs_url = "https://api.dubtrack.fm/playlist/" + response.data._id + "/songs";
        push_traxx();
    });
    function push_traxx () {
        if (traxx.length == 0) {
            console.log("done!");
            return;
        }
        $.post(songs_url, {
            fkid: traxx.pop(),
            type: "youtube"
        }, function () {
            console.log("track imported! " + traxx.length + " left...");
            push_traxx();
        });
    }
}).toString() + ")();";

function generate () {
    var playlistId = $("#playlist").val();
    loadClient.then(function () {
        return getVideos(playlistId);
    }).then(function (videos) {
        gapi.client.youtube.playlists.list({
            part: "snippet",
            id: playlistId
        }).execute(function (response) {
            $("#results").text(
                IMPORT_CODE_TEMPLATE
                    .replace("TITLE", response.items[0].snippet.title)
                    .replace("TRACK_IDS", JSON.stringify(videos))
            );
        });
    });
}

function getVideos (playlistId, pageToken) {
    var deferred = $.Deferred();
    gapi.client.youtube.playlistItems.list({
        part: "contentDetails",
        playlistId: playlistId,
        maxResults: 50,
        pageToken: pageToken
    }).execute(function (response) {
        if (!response.result) {
            deferred.reject("Can't retrieve playlist videos!");
        } else {
            var videos = response.result.items.map(function (item) {
                return item.contentDetails.videoId;
            });
            if (response.result.nextPageToken) {
                getVideos(playlistId, response.result.nextPageToken)
                    .then(function (restVideos) {
                        deferred.resolve(videos.concat(restVideos));
                    });
            } else {
                deferred.resolve(videos);
            }
        }
    });
    return deferred;
}
