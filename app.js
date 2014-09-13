///////////global//////////////////////////
count = 0;
interval = getIntervalFromFps(30);

key = 
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

///////////SoundManager//////////////////////
function SoundManager() {
	//パラメーター
	source_num = 32;
	this.osc = new Array(source_num);
	this.gin = new Array(source_num);
	this.osc_state = new Array(source_num);
	this.intervalid = new Array(source_num);
	setValue(this.osc_state, "isEmpty");
	setValue(this.intervalid, null);
	
	this.egParams = {
		attack : 0,
		decay : 0,
		sustain : 0,
		release : 0
	};
	
	//初期化
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioctx = new AudioContext();
		
	this.audioctx.createGain = this.audioctx.createGain || this.audioctx.createGainNode;

	for(var osp=0; osp<source_num; osp++)
		this.osc[osp] = this.audioctx.createOscillator();

	this.allGin = this.audioctx.createGain(); //全体音量
	this.comp = this.audioctx.createDynamicsCompressor();
	
	this.allGin.connect(this.comp);
	this.comp.connect(this.audioctx.destination);

	this.allGin.gain.value = 0.5;
	
	for(var i=0; i<this.gin.length; i++)
		this.gin[i] = this.audioctx.createGain(); 
}	
SoundManager.prototype = {
	playSound : function(freq, type, detune) {
		//空いている音源を検索
		for(var osp=0; osp < this.osc.length; osp++)
			if(this.osc_state[osp]=="isEmpty") break;
		if(osp >= this.osc.length) return;
		
		this.osc[osp] = this.audioctx.createOscillator();

		this.osc[osp].type = type;		
		this.osc[osp].frequency.value = freq;
		this.osc[osp].detune.value = detune;

		this.osc[osp].connect(this.gin[osp]);
		this.gin[osp].connect(this.allGin);

		var t0 = this.audioctx.currentTime;
		var t1 = t0 + this.egParams.attack;
		var t2 = this.egParams.decay;
		var t2Value = this.egParams.sustain;

		var v0 = 0;
		
		this.osc[osp].start(0);
		this.gin[osp].gain.setValueAtTime(v0, t0);
		this.gin[osp].gain.linearRampToValueAtTime(1, t1);
		this.gin[osp].gain.setTargetAtTime(t2Value, t1, t2);
		
		this.osc_state[osp] = "isPlaying";
		return osp;
	} ,
	stopSound : function(osp) {
		this.osc_state[osp] = "isStopping";
		this.osc[osp].stop  = this.osc[osp].stop  || osc[osp].noteOff;
		var t3 = this.audioctx.currentTime;
		var t4 = this.egParams.release;
		this.gin[osp].gain.cancelScheduledValues(t3);
		this.gin[osp].gain.setValueAtTime(this.gin[osp].gain.value, t3);
		this.gin[osp].gain.setTargetAtTime(0, t3, t4);
		
		var _this = this;
		this.intervalid[osp] = window.setInterval(function(){
			var VALUE_OF_STOP = 1e-3;
	        if (_this.gin[osp].gain.value < VALUE_OF_STOP) {
				_this.gin[osp].gain.cancelScheduledValues(0);
				_this.osc[osp].stop(0);
				_this.osc_state[osp]="isEmpty";
				window.clearInterval(_this.intervalid[osp]);
				_this.intervalid[osp] = null;
	        }
			},0);
	}
};

//独自_楽器
function Instrumental(sm) {
	this.note_osp = Array(120);
	this.note_state = new Array(120);
	this.type = "sin";
	this.detune = 0;
	setValue(this.note_osp, -1);
	setValue(this.note_state, false);
	SM = sm;
}

Instrumental.prototype = {
	playNote : function(note) {
		if(this.note_state[note] == false) {
			this.note_state[note] = true;
			var osp = SM.playSound(this.noteToFreq(note), this.type, this.detune);
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

//objを指定できる場合のみ有効
function setValueAsNumToObj(obj, id){
	var ele = document.getElementById(id);
	obj = ele.value;
	ele.addEventListener("change", function() {
	  obj = this.valueAsNumber;
	  console.log(obj);
	}, false);
}

window.onload = function() {
	sm = new SoundManager();
	inst = new Instrumental(sm);
	
	var volume = document.getElementById("volume");
	sm.allGin.gain.value = volume.value;
	volume.addEventListener("change", function() {
	  sm.allGin.gain.value = this.value;
	}, false);
	
	var detune = document.getElementById("detune");
	inst.detune = detune.valueAsNumber;
	detune.addEventListener("change", function() {
	  inst.detune = this.valueAsNumber;
	}, false);
	
	var attack = document.getElementById("attack");
	sm.egParams.attack = attack.valueAsNumber;
	attack.addEventListener("change", function() {
	  sm.egParams.attack = this.valueAsNumber;
	}, false);
	
	var decay = document.getElementById("decay");
	sm.egParams.decay = decay.valueAsNumber;
	decay.addEventListener("change", function() {
	  sm.egParams.decay = this.valueAsNumber;
	}, false);
	
	var sustain = document.getElementById("sustain");
	sm.egParams.sustain = sustain.valueAsNumber;
	sustain.addEventListener("change", function() {
	  sm.egParams.sustain = this.valueAsNumber;
	}, false);
	
	var release = document.getElementById("release");
	sm.egParams.release = release.valueAsNumber;
	release.addEventListener("change", function() {
	  sm.egParams.release = this.valueAsNumber;
	}, false);
	
	var radioList = document.getElementsByName("wave");
    for(var i=0; i<radioList.length; i++) {
        radioList[i].addEventListener("click",function(){
            inst.type = this.value;
        },false);
    }
	
	setInterval("main()", interval);
}

function main(){
	//カウント更新	
	if(count++ >= 60) count = 0;
	
	keyNoteStr_l = "" + noteKeyControl(noteOnkey_l, key_l);
	
	keyNoteStr_r = "";
	for(var i=0; i<keyNoteStr_l.length; i++)
		keyNoteStr_r += "  ";
	keyNoteStr_r += "" + noteKeyControl(noteOnkey_r, key_r);
	
	//画面の描画a
	draw();
	
	//キー情報退避
	for(var k in key_state)
		tmp_key_state[k] = key_state[k];
}

function noteKeyControl(noteOnkey, key, type) {
	var keyNoteStr = "";
	for(var k=0; k<noteOnkey.length; k++)
		if(key_state[key[k]]==true) {
			inst.playNote(noteOnkey[k], type);
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
	e.which = e.keyCode || e.which;
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