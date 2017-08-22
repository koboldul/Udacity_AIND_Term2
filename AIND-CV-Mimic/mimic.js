// Mimic Me!
// Fun game where you need to express emojis being displayed

// --- Affectiva setup ---

// The affdex SDK Needs to create video and canvas elements in the DOM
var divRoot = $("#camera")[0];  // div node where we want to add these elements
var width = 640, height = 480;  // camera image size
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;  // face mode parameter

// Initialize an Affectiva CameraDetector object
var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

//Game 
var m_game;
$('#progressbar').hide();
const facesPerLevel = 10;

// Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllEmojis();
detector.detectAllAppearance();

// --- Utility values and functions ---

// Unicode values for all emojis Affectiva can detect
var emojis = [ 128528, 9786, 128515 , 128524, 128527, 128521, 128535, 128539, 128540, 128542, 128545, 128563, 128561 ];

class MimicGame
{
  /*
   * constructor params:
   * @t: total number of challenges per level
   * @:scoreHolder: the dom element that will display the score. 
   * @:challengeHolder: the dom element that will display the current challenge. 
   * @:levelHolder: the dom element that will display the level. 
   */
  constructor(t, scoreHolder, challengeHolder, levelHolder)  {

    this._total = 0;
    this._score =	0;
    this._currentEmoji = 0;
    this._level = 0;
    this._isInProgress = true;
    this._scoreHolder = scoreHolder;
    this._challengeHolder = challengeHolder;
    this._levelHolder = levelHolder;

    this._levelTimer = null;
    this._levels = new Map([[1, 40], [2, 35], [3, 30], [4, 25], [5, 20], [6, 15],  [7, 10]]);

    this.total = t === undefined || isNaN(t) ? 10 : t;
    this._startNewLevel();
  }
	
	get score() 
	{
		return this._score;		
	};
	
	set score(score)
	{
		this._score = score;
		this._setScore();
	};	
	
	get total() 
	{
		return this._total;		
	};
	
	set total(total)
	{
		this._total = total;
		this._setScore();
  };
  
  get isInProgress() 
	{
		return this._isInProgress;		
	};
	
	set isInProgress(inProgress)
	{
		this._isInProgress = inProgress;
	};
  
  checkEmoji(emoji){
      if (emoji === this._currentEmoji) {
          this.score += 1;
          if (this._score == this._total){
            //Win
            this._level++;
            this._startNewLevel(true);
          }
          else {
            this.setTargetEmoji();
          }
      }
  };

  setTargetEmoji() {
    let idx = Math.floor((Math.random() * emojis.length) + 1);
    let code = emojis[idx-1];

    this._currentEmoji = code;
    this._challengeHolder.html(`&#${code};`);

    var progress = 0;
    if (this._levelTimer != null){
      this._cancelTimer();
    }  

    let duration = this._levels.get(this._level+1);
    $('#presureSize').html(`${duration}s`);
    duration *= 10;
    
    this._levelTimer = setInterval(() => {
      $("#progressbar").progressbar({
        value: ++progress
      });
      if(progress == 100) {
        this._cancelTimer();
        this._startNewLevel(false);
      }
    }, duration);
    $('#progressbar').show();
        
    $("#progressbar").progressbar({
        value: progress
    });
  };

  reset() {
    this._level = 0;
    this._startNewLevel();
  };
  
  // 'Private'
  _cancelTimer(){
    clearInterval(this._levelTimer);
    $('#progressbar').hide();
  };

  _setScore() {
    this._scoreHolder.html(`Score:${this._score} / ${this._total}`);  
  };

  _startNewLevel(levelSuccessuful){
    this.score = 0;
    this._cancelTimer();

    if (this._level >= this._levels.size || levelSuccessuful === false){
      alert(levelSuccessuful ? 
        'You won and completed all the levels. No more levels. Please insert coin to buy more!' : 
        'Better luck next time. Does your face hurt? Never mind, start a new game.');
      this.reset();  
    }
    else{
      alert(`Level ${this._level+1}`);
      this._levelHolder.html(`Level ${this._level+1}`);
      this.setTargetEmoji();
    }
  };
};


// Convert a special character to its unicode value (can be 1 or 2 units long)
function toUnicode(c) {
  if(c.length == 1)
    return c.charCodeAt(0);
  return ((((c.charCodeAt(0) - 0xD800) * 0x400) + (c.charCodeAt(1) - 0xDC00) + 0x10000));
}

// Display log messages and tracking results
function log(node_name, msg) {
  $(node_name).append("<span>" + msg + "</span><br />")
}

// --- Callback functions ---

// Start button
function onStart() {
  if (detector && !detector.isRunning) {
    $("#logs").html("");  // clear out previous log
    detector.start();  // start detector
  }
  log('#logs', "Start button pressed");
  
  if (m_game == null) {
    m_game = new MimicGame(facesPerLevel, $('#score') ,$('#target'), $('#level'));
  }
}

// Stop button
function onStop() {
  log('#logs', "Stop button pressed");
  if (detector && detector.isRunning) {
    detector.removeEventListener();
    detector.stop();  // stop detector
  }
  m_game.reset();
  m_game = null;
};

// Reset button
function onReset() {
  log('#logs', "Reset button pressed");
  if (detector && detector.isRunning) {
    detector.reset();
  }
  $('#results').html("");  // clear out results
  $("#logs").html("");  // clear out previous log

  if (m_game != null && confirm('You are doing great. Are you sure  you want to reset?')){
    m_game.reset();
  }
};

// Add a callback to notify when camera access is allowed
detector.addEventListener("onWebcamConnectSuccess", function() {
  log('#logs', "Webcam access allowed");
});

// Add a callback to notify when camera access is denied
detector.addEventListener("onWebcamConnectFailure", function() {
  log('#logs', "webcam denied");
  console.log("Webcam access denied");
});

// Add a callback to notify when detector is stopped
detector.addEventListener("onStopSuccess", function() {
  log('#logs', "The detector reports stopped");
  $("#results").html("");
});

// Add a callback to notify when the detector is initialized and ready for running
detector.addEventListener("onInitializeSuccess", function() {
  log('#logs', "The detector reports initialized");
  //Display canvas instead of video feed because we want to draw the feature points on it
  $("#face_video_canvas").css("display", "block");
  $("#face_video").css("display", "none");

  // TODO(optional): Call a function to initialize the game, if needed
  // <your code here>
});

// Add a callback to receive the results from processing an image
// NOTE: The faces object contains a list of the faces detected in the image,
//   probabilities for different expressions, emotions and appearance metrics
detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
  var canvas = $('#face_video_canvas')[0];
  
  if (!canvas)
    return;

  // Report how many faces were found
  $('#results').html("");
  log('#results', "Timestamp: " + timestamp.toFixed(2));
  log('#results', "Number of faces found: " + faces.length);
  if (faces.length > 0) {
    // Report desired metrics
    log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
    log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Emoji: " + faces[0].emojis.dominantEmoji);

    // Call functions to draw feature points and dominant emoji (for the first face only)
    drawFeaturePoints(canvas, image, faces[0]);
    drawEmoji(canvas, image, faces[0]);

    m_game.checkEmoji(toUnicode(faces[0].emojis.dominantEmoji));
  }
});


// --- Custom functions ---

// Draw the detected facial feature points on the image
function drawFeaturePoints(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#13FC00';
  
  // Loop over each feature point in the face
  let ii = 0;
  ctx.font = '8px serif';
  for (var id in face.featurePoints) {
    ii++;
    var fp = face.featurePoints[id];
    ctx.fillText(ii, fp.x, fp.y);
   
	// ctx.beginPath();
	// ctx.arc(fp.x,fp.y,2,0,2*Math.PI);
	// ctx.stroke();
  }
}

// Draw the dominant emoji on the image
function drawEmoji(canvas, img, face) {
  // Obtain a 2D context object to draw on the canvas
  var ctx = canvas.getContext('2d');
  let fp_0 = face.featurePoints[0];	
  let em = face.emojis.dominantEmoji;
  
  ctx.font = '48px serif';
  ctx.fillText(em, fp_0.x-70, fp_0.y);
}



// TODO: Define any variables and functions to implement the Mimic Me! game mechanics

// NOTE:
// - Remember to call your update function from the "onImageResultsSuccess" event handler above
// - You can use setTargetEmoji() and setScore() functions to update the respective elements
// - You will have to pass in emojis as unicode values, e.g. setTargetEmoji(128578) for a simple smiley
// - Unicode values for all emojis recognized by Affectiva are provided above in the list 'emojis'
// - To check for a match, you can convert the dominant emoji to unicode using the toUnicode() function

// Optional:
// - Define an initialization/reset function, and call it from the "onInitializeSuccess" event handler above
// - Define a game reset function (same as init?), and call it from the onReset() function above

// <your code here>
