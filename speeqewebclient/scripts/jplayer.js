Speeqe.Jplayer = function() {
    var playItem = 0;
    var jplayer_ready = false;
    var theplayer = null;
    var myPlayList = [];
    var displayPlayList = function() {
	$("#jplayer_playlist ul").empty();
        for (var i=0; i < myPlayList.length; i++)
        {
	    var listItem = (i == myPlayList.length-1) ? "<li class='jplayer_playlist_item_last'>" : "<li>";
	    listItem += "<a href='#' id='jplayer_playlist_item_"+
                i+"' tabindex='1'>"+ myPlayList[i].name +"</a></li>";
	    $("#jplayer_playlist ul").append(listItem);
	    $("#jplayer_playlist_item_"+i)
                .data( "index", i ).click( function() {
		    var index = $(this).data("index");
                    playListChange(index);
		    $(this).blur();
		    return false;
		});
	}
    };
    var playListInit = function(autoplay) {
        if (myPlayList.length > 0)
        {
            if (autoplay)
            {
	        playListChange(playItem);
	    }
            else
            {
	        playListConfig(playItem);
	    }
        }
    };
    var playListConfig = function(index) {
	$("#jplayer_playlist_item_"+playItem)
            .removeClass("jplayer_playlist_current").parent()
            .removeClass("jplayer_playlist_current");
	$("#jplayer_playlist_item_"+index)
            .addClass("jplayer_playlist_current").parent()
            .addClass("jplayer_playlist_current");
	playItem = index;
	$("#jquery_jplayer").jPlayer("setFile",
                                     myPlayList[playItem].mp3,
                                     myPlayList[playItem].ogg);
    };
    var playListChange = function(index) {
	playListConfig(index);
        $("#jquery_jplayer").jPlayer("play");
    };
    var playListNext = function() {
	var index = (playItem+1 < myPlayList.length) ? playItem+1 : 0;
	playListChange(index);
    };
    var playListPrev = function() {
	var index = (playItem-1 >= 0) ? playItem-1 : myPlayList.length-1;
	playListChange(index);
    };
    var instanceInfo = function(myPlayer, myInfo) {
        if (myInfo)
        {
            var jPlayerInfo = "<p>This jPlayer instance is running in your browser using ";
            
	    if(myPlayer.jPlayer("getData", "usingFlash"))
            {
	        jPlayerInfo += "<strong>Flash</strong> with ";
	    }
            else
            {
	        jPlayerInfo += "<strong>HTML5</strong> with ";
	    }	
	    if(myPlayer.jPlayer("getData", "usingMP3"))
            {
	        jPlayerInfo += "<strong>MP3</strong>";
	    }
            else
            {
	        jPlayerInfo += "<strong>OGG</strong>";
	    }
	    jPlayerInfo += " files.<br />This instance is using the constructor options:<br /><code>$(\"#" + myPlayer.jPlayer("getData", "id") + "\").jPlayer({<br />";	
	    jPlayerInfo += "&nbsp;&nbsp;&nbsp;nativeSupport: " + myPlayer.jPlayer("getData", "nativeSupport");
	    jPlayerInfo += ", oggSupport: " + myPlayer.jPlayer("getData", "oggSupport");
	    jPlayerInfo += ", customCssIds: " + myPlayer.jPlayer("getData", "customCssIds");	
	    jPlayerInfo += "<br />});</code></p>";
	    myInfo.html(jPlayerInfo);
        }
    };
    var statusInfo = function(myPlayer, myInfo) {
        if (myInfo)
        {
            var jPlayerStatus = "<p>jPlayer is ";
	    jPlayerStatus += (myPlayer.jPlayer("getData", "diag.isPlaying") ? "playing" : "stopped");
	    jPlayerStatus += " at time: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedTime")) + "ms.";
	    jPlayerStatus += " (tt: " + Math.floor(myPlayer.jPlayer("getData", "diag.totalTime")) + "ms";
	    jPlayerStatus += ", lp: " + Math.floor(myPlayer.jPlayer("getData", "diag.loadPercent")) + "%";
	    jPlayerStatus += ", ppr: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedPercentRelative")) + "%";
	    jPlayerStatus += ", ppa: " + Math.floor(myPlayer.jPlayer("getData", "diag.playedPercentAbsolute")) + "%)</p>"
	    myInfo.html(jPlayerStatus)
        };
    };
    $(document).ready(function() {
        var $jpPlayTime = $("#jplayer_play_time");
	var $jpTotalTime = $("#jplayer_total_time");        
        var jpStatus = $("#demo_status");
        theplayer = $("#jquery_jplayer").jPlayer({
	    ready: function () {
                jplayer_ready = true;
		displayPlayList();
		playListInit(false); // Parameter is a boolean for autoplay.
                instanceInfo(this.element, $("#demo_info"));
	    },
            swfPath: "scripts",
	    volume: 50,
	    oggSupport: true,
	    preload: 'none'
        })
            .jPlayer("onProgressChange",
                     function(loadPercent,
                              playedPercentRelative,
                              playedPercentAbsolute,
                              playedTime,
                              totalTime) {
		         $jpPlayTime.text($.jPlayer.convertTime(playedTime));
		         $jpTotalTime.text($.jPlayer.convertTime(totalTime));
                         statusInfo(this.element, jpStatus);
                     })
	    .jPlayer("onSoundComplete", function() {
		playListNext();
	    });
        $("#jplayer_previous").click(function() {
	    playListPrev();
	    $(this).blur();
	    return false;
	});
	$("#jplayer_next").click(function() {
	    playListNext();
	    $(this).blur();
	    return false;
	});
        $("#jplayer_hide").click(function() {
            $("#thejplayer").hide();
        });
    });
    var obj = {
        setFile: function(filename) {
            var mp3file = "";
            var oggfile = "";
            if (filename.indexOf(".mp3") !== -1)
            {
                mp3file = filename;
            }
            if (filename.indexOf(".ogg") !== -1)
            {
                oggfile = filename;
            }
            var playitem = {name:filename, mp3:mp3file, ogg:oggfile};
            myPlayList.push(playitem);
            displayPlayList();
        },
        play: function() {
            if (jplayer_ready)
            {
                theplayer.jPlayer("play");
            }
        }
    };
    return obj;
}();