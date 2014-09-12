///////////global//////////////////////////
var count = 0;
var interval = getIntervalFromFps(30);

var key = 
{ "0":48, "1":49, "2":50, "3":51, "4":52, "5":53, "6":54, "7":55, "8":56, "9":57,
a:65, b:66, c:67, d:68, e:69, f:70, g:71, h:72, i:73, j:74, k:75,l:76, m:77,
n:78, o:79, p:80, q:81, r:82, s:83, t:84, u:85, v:86, w:87, x:88, y:89, z:90,
"-":189, "^":222, "@":192, "[":219, ";":187, ":":186, "]":221, ",":188, ".":190, "/":191, "\\":226};

var f = false;
var tmp_key_state = 
{"0":f, "1":f, "2":f, "3":f, "4":f, "5":f, "6":f, "7":f, "8":f, "9":f,
a:f, b:f, c:f, d:f, e:f, f:f, g:f, h:f, i:f, j:f,k:f, l:f, m:f, n:f, o:f,p:f, q:f, r:f, s:f, t:f, u:f, v:f, w:f, x:f, y:f, z:f,
"-":f, "^":f, "\\":f, "@":f, "[":f, ";":f, ":":f, "]":f, ",":f, ".":f, "/":f};
var key_state = 
{"0":f, "1":f, "2":f, "3":f, "4":f, "5":f, "6":f, "7":f, "8":f, "9":f,
a:f, b:f, c:f, d:f, e:f, f:f, g:f, h:f, i:f, j:f,k:f, l:f, m:f, n:f, o:f,p:f, q:f, r:f, s:f, t:f, u:f, v:f, w:f, x:f, y:f, z:f,
"-":f, "^":f, "\\":f, "@":f, "[":f, ";":f, ":":f, "]":f, ",":f, ".":f, "/":f};
var key_down =
{"0":f, "1":f, "2":f, "3":f, "4":f, "5":f, "6":f, "7":f, "8":f, "9":f,
a:f, b:f, c:f, d:f, e:f, f:f, g:f, h:f, i:f, j:f,k:f, l:f, m:f, n:f, o:f,p:f, q:f, r:f, s:f, t:f, u:f, v:f, w:f, x:f, y:f, z:f,
"-":f, "^":f, "\\":f, "@":f, "[":f, ";":f, ":":f, "]":f, ",":f, ".":f, "/":f};

///////////SoundManager//////////////////////
function SoundManager() {
	//パラメーター
	this.osc = new Array(16);
	this.gin = new Array(16);
	this.osc_state = new Array(16);
	setValue(this.osc_state, "isEmpty");
	
	//初期化
	if(typeof(webkitAudioContext)!=="undefined")
    	this.audioctx = new webkitAudioContext();
	else if(typeof(AudioContext)!=="undefined")
    	this.audioctx = new AudioContext();

	this.allGin = this.audioctx.createGain(); //全体音量

	this.comp = this.audioctx.createDynamicsCompressor();

	this.allGin.connect(this.comp);
	this.comp.connect(this.audioctx.destination);

	this.allGin.gain.value = 0.5;
	
	for(var i=0; i<this.gin.length; i++)
		this.gin[i] = this.audioctx.createGain(); 
}	
SoundManager.prototype = {
	playSound : function(f) {
		//空いている音源を検索
		for(var osp=0; osp < this.osc.length; osp++)
			if(this.osc_state[osp] == "isEmpty") break;
		if(osp >= this.osc.length) return;
		
		this.osc[osp] = this.audioctx.createOscillator();
		this.osc[osp].frequency.value = f;

		this.osc[osp].connect(this.gin[osp]);
		this.gin[osp].connect(this.allGin);

		var v = 1;
		this.gin[osp].gain.value = v;
		
		this.osc[osp].start(0);
		
		this.osc_state[osp] = "isPlaying";
		return osp;
	} ,
	stopSound : function(osp) {
		this.osc_state[osp] = "isStopping";
		this.osc[osp].stop  = this.osc[osp].stop  || osc[osp].noteOff;
		this.gin[osp].gain.setTargetAtTime(0, 0, 0.01);
		var _this = this;
		setTimeout(function(){_this.gin[osp].gain.value;}, 400);
		setTimeout(function(){
			_this.osc[osp].stop(0); _this.osc_state[osp]="isEmpty"; _this.gin[osp].gain.cancelScheduledValues(0);
			}, 500);
	}
};

//独自_楽器
function Instrumental(sm) {
	this.note_osp = Array(120);
	this.note_state = new Array(120);
	setValue(this.note_osp, -1);
	setValue(this.note_state, false);
	SM = sm;
}

Instrumental.prototype = {
	playNote : function(note) {
		if(this.note_state[note] == false) {
			this.note_state[note] = true;
			var osp = SM.playSound(this.noteToFreq(note));
			this.note_osp[note] = osp;
		}
	},
	stopNote : function(note) {
		if(this.note_state[note] == true) {
			if(this.note_state[note] == true) {
				var osp = this.note_osp[note];
				this.note_osp[note] = -1;
				this.note_state[note] = false;
				SM.stopSound(osp);
			}
		}
	} ,
	noteToFreq : function (note) {
		var f_base = 440
		var note_base = 67;
		var f = f_base;
		var note_distance = note - note_base;
		if(note_distance > 0) {
			for(var i = 0; i < note_distance; i++)
			f *= 1.0595;
		} else {
			note_distance = Math.abs(note_distance);
			for(var i=0; i < note_distance; i++)
			f /= 1.0595;
		}
		return f;
	}
};

var key_l = 
["z", "x", "c", "v", "b", "a", "s", "d", "f", "g", "q", "w", "e", "r", "t", "2", "3", "4", "5", "6"];
var key_r = 
["n", "m", ",", ".", "/", "j", "k", "l", ";", ":", "u", "i", "o", "p", "@", "7", "8", "9", "0", "-"];

var noteOnkey_l = new Array(key_l.length);
var noteOnkey_r = new Array(key_r.length);

function setNoteOnKey(noteOnkey, base) {
	for(var i=0; i<noteOnkey.length; i++){
		noteOnkey[i] = base + i;
	}
}

var base = 60;
setNoteOnKey(noteOnkey_r, base);
setNoteOnKey(noteOnkey_l, base-20);


window.onload = function() {
	sm = new SoundManager();
	inst = new Instrumental(sm);
	var volume = document.getElementById("volume");
	sm.allGin.gain.value = volume.value / 100;
	volume.addEventListener("change", function() {
	  sm.allGin.gain.value = volume.value / 100;
	}, false);
	main();
}

function main(){
	//キーを押した瞬間の変数更新
	for(k in key_state)
		if(key_state[k]==true && tmp_key_state[k]==false)
			key_down[k] = true;
		else 
			key_down[k] = false;
			
	//カウント更新	
	if(count++ >= 60) count = 0;
	
	keyNoteStr_l = "" + noteKeyControl(noteOnkey_l, key_l);
	
	keyNoteStr_r = "";
	for(var i=0; i<keyNoteStr_l.length; i++)
		keyNoteStr_r += "  ";
	keyNoteStr_r += "" + noteKeyControl(noteOnkey_r, key_r);
	
	//sm.main();
	
	//画面の描画a
	draw();
	
	//キー情報退避
	for(var k in key_state)
		tmp_key_state[k] = key_state[k];
	setTimeout("main()", interval);
}

function noteKeyControl(noteOnkey, key) {
	var keyNoteStr = "";
	for(var k=0; k<noteOnkey.length; k++)
		if(key_state[key[k]]==true) {
			inst.playNote(noteOnkey[k]);
			keyNoteStr += getStringFromNote(noteOnkey[k]) + " ";
		} else if(key_state[key[k]]==false)
			inst.stopNote(noteOnkey[k]);
	return keyNoteStr;
}

//独自
function draw() {
	//キャンバス取得
	var c = document.getElementById("canvas");
	var ctx = c.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//描画
	drawKeyNote(ctx, noteOnkey_l, 0);
	drawKeyNote(ctx, noteOnkey_r, 400);

	//画面の取得
	var c = document.getElementById("text_canvas");
	var ctx = c.getContext('2d');
	//描画
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.font = "bold 18px 'ＭＳ Ｐゴシック'";
	ctx.fillStyle = "red";
	ctx.fillText(keyNoteStr_l, 0, 18);
	ctx.fillStyle = "red";
	ctx.fillText(keyNoteStr_r, 0, 18);
	
	//画面の取得
	var c = document.getElementById("note_canvas");
	var ctx = c.getContext('2d');
	//描画
	ctx.clearRect(0, 0, c.width, c.height);
	var img_ton = new Image();
	img_ton.src = "./onpu064.png";
	var img_hon = new Image();
	img_hon.src = "./onpu065.png";
	var img_zen = new Image();
	img_zen.src = "./onpu048.png";
	var img_shp = new Image();
	img_shp.src = "./onpu052.png";

	//５線符	
	ctx.drawImage(img_ton, 5, 0, 28, 75);
	ctx.beginPath();
	var p = 67;
	for(var i=0; i<5; i++){
		ctx.moveTo(0, p - 10 - i*10);
		ctx.lineTo(500, p - 10 - i*10);
	}
	p = 127;
	ctx.drawImage(img_hon, 5, p-50, 30, 33);
	for(var i=0; i<5; i++){
		ctx.moveTo(0, p - 10 - i*10);
		ctx.lineTo(500, p - 10 - i*10);
	}
	ctx.moveTo(0, p - 10*11);
	ctx.lineTo(0, p-10);
	ctx.stroke();

	//音符	
	var px = 100;
	var tmp_x = px;
	var x = px-30;
	ctx.beginPath();
	for(var k in inst.note_state) {
		/*var x = px;
		if(inst.note_state[k-1]==true)
			if(tmp_x <= px)
				x += 10;
		tmp_x = x;*/
		if(inst.note_state[k] == true) {
			x += 30;
			shp=false;
			switch(k%12){
				case 0: a=0; break;
				case 1: a=0; shp=true; break;
				case 2: a=1; break;
				case 3: a=1; shp=true; break;
				case 4: a=2; break;
				case 5: a=3; break;
				case 6: a=3; shp=true; break;
				case 7: a=4; break;
				case 8: a=4; shp=true; break;
				case 9: a=5; break;
				case 10: a=5; shp=true; break;
				case 11: a=6; break;
			}
			k = (Math.floor(k/12)-2) * 7 - 21 + a;
			var y = 67 - (k * 5);
			ctx.drawImage(img_zen, x-7, y-5, 15, 10);
			if(shp==true)
				ctx.drawImage(img_shp, x+10, y-10, 6, 15);
			if(k==0 || k==-12) {
				ctx.moveTo(x-15, y);
				ctx.lineTo(x+15, y);
			}
		}
	}
	ctx.stroke();
}

var base_r = 60;
var base_l = 40;
//keynoteを描画
function drawKeyNote(ctx, noteOnkey, px) {
	var n = 0;
	var w = 50;
	var s = 20;
	var y_max = 3 * (w+s);
	for(var k=0; k<noteOnkey.length; k++) {
		var note = noteOnkey[k];
		var x = px + (k % 5) * w + (k % 5) * s;
		var y = y_max - Math.floor(k / 5) * w - Math.floor(k / 5) * s;
		ctx.beginPath();
		if(inst.note_state[note] == true)
			ctx.fillStyle = "red";
		else
			ctx.fillStyle = "grey";
		ctx.fillRect(x, y, w, w);
		n++;
	}
}

//独自
var strOnnote = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function getStringFromNote(note) {
	var octavus = Math.floor(note / 12) - 2;
	var i = note % 12;
	return strOnnote[i] + octavus;
}

document.onkeydown = function (e){
	var k_code = e.which;
	for(k in key)
	if(k_code == key[k] && key_state[k] == false) {
		key_state[k] = true;
	}
}

document.onkeyup =  function (e) {
	var k_code = e.which;
	for(k in key)
	if(k_code == key[k] && key_state[k] == true) {
		key_state[k] = false;
		return;
	}
}

function getIntervalFromFps(fps) {
	return 1000 / fps;
}

function setValue(box, value){
	for(var i=0; i<box.length; i++) {
		box[i] = value;
	}
	return;
}