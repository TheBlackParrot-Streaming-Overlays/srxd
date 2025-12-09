var isPaused = false;

function formatTime(val) {
	let secs = val % 60;
	let mins = Math.floor(val / 60);

	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePause(state) {
	if(localStorage.getItem("setting_srxd_desaturateOnPause") === "true") {
		if(state) {
			console.log("PAUSED");
			$("body").addClass("pause");
		} else {
			console.log("RESUMED");
			$("body").removeClass("pause");
		}
	} else {
		$("body").removeClass("pause");
	}

	isPaused = state;
}

var songLength = 1;
var currentScene = "Menu";
var oldScene;
var previousState = "";
var activeMap = {};

function setArt() {
	let artData;

	if(!("cover" in activeMap)) {
		return;
	}

	if(localStorage.getItem("setting_srxd_useRemoteArtURL") === "true") {
		artData = activeMap.cover.external.image;
		if(activeMap.cover.external.image === null && activeMap.cover.internal.image !== null) {
			artData = activeMap.cover.internal.image;
		}
	} else {
		artData = activeMap.cover.internal.image;
	}

	if(artData === null) {
		artData = 'placeholder.png';
	}

	/*if(localStorage.getItem("setting_beatSaberDataMod") === "bsplus" && localStorage.getItem("setting_srxd_useRemoteArtURL") === "false" && artData !== null) {
		//rootCSS().setProperty("--artFilters", "saturate(75%) contrast(67%) brightness(133%)");
		rootCSS().setProperty("--artFilters", "saturate(75%) contrast(80%) brightness(133%)")
	} else {
		rootCSS().setProperty("--artFilters", "opacity(1)");
	}*/

	rootCSS().setProperty("--art-url", `url('${artData}')`);
	$("#art, #artDoppleganger").attr("src", artData);

	$("#artDoppleganger").on("load", function() {
		if(artState) {
			$("#artWrapper").removeClass("fadeOut").addClass("fadeIn");
			$("#bgWrapper").removeClass("fadeOut").addClass("fadeInLong");
		}
	});

	let darkColor = activeMap.cover.colors.dark;
	let lightColor = activeMap.cover.colors.light;

	if(localStorage.getItem("setting_srxd_ensureColorIsBrightEnough") === "true") {
		let minBrightness = (parseFloat(localStorage.getItem("setting_srxd_colorMinBrightness"))/100) * 255;
		let maxBrightness = (parseFloat(localStorage.getItem("setting_srxd_colorMaxBrightness"))/100) * 255;

		darkColor = ensureSafeColor(darkColor, minBrightness, maxBrightness);
		lightColor = ensureSafeColor(lightColor, minBrightness, maxBrightness);
	}

	localStorage.setItem("art_darkColor", darkColor);
	localStorage.setItem("art_lightColor", lightColor);
	$(":root").get(0).style.setProperty("--colorDark", darkColor);
	$(":root").get(0).style.setProperty("--colorLight", lightColor);
}

function setQR() {
	if(!("qrCode" in activeMap)) {
		$("#qrCell").hide();
		return;
	}

	if(activeMap.map.code === null) {
		$("#qrCell").hide();
		return;
	}

	$("#qr").attr("src", `data:image/svg+xml;base64,${activeMap.qrCode}`);

	if($("#qrCell").attr("data-enabled") === "true") {
		$("#qrCell").show();
	}
}

function updateMarquee() {
	if($("#titleString").text() === "") {
		return;
	}

	console.log("marquee update called");
	$("#titleString").marquee('destroy');

	if(localStorage.getItem("setting_srxd_enableMarquee") === "true") {
		let parentWidth = $("#title").width();
		let childWidth = $("#titleString").width();
		let delayAmount = parseFloat(localStorage.getItem("setting_srxd_marqueeDelay")) * 1000;

		if(childWidth > parentWidth) {
			$("#titleString").bind('finished', function() {
				$("#titleString").marquee('pause');
				setTimeout(function() {
					$("#titleString").marquee('resume');
				}, delayAmount);
			})
			.marquee({
				speed: parseInt(localStorage.getItem("setting_srxd_marqueeSpeed")),
				pauseOnCycle: true,
				startVisible: true,
				delayBeforeStart: delayAmount,
				duplicated: true,
				gap: parseInt(localStorage.getItem("setting_srxd_marqueeGap"))
			});
			rootCSS().setProperty("--titleAlignment", "start");
		} else {
			rootCSS().setProperty("--titleAlignment", "var(--metadataAlignment)");
		}
	} else {
		rootCSS().setProperty("--titleAlignment", "var(--metadataAlignment)");
	}
}

function updateSecondaryMarquee() {
	let childElement = ($("#mapperContainer").is(":visible") ? $("#mapperContainer") : $("#artist"));
	let parentElement = childElement.parent();
	let childWidth = childElement.width();
	let parentWidth = parentElement.width();

	parentElement.children().removeClass("cssScroll");
	parentElement.removeClass("cssScrollClippingWorkaround").removeClass("slideIn");

	if(localStorage.getItem("setting_srxd_enableMarquee") === "false") {
		secondaryTimer = setTimeout(switchSecondary, parseInt(localStorage.getItem("setting_srxd_artistMapperCycleDelay")) * 1000);
		return;
	}

	if(childWidth > parentWidth) {
		console.log(`${childWidth} > ${parentWidth}`);

		const extra = childWidth - parentWidth;
		const speed = extra / (parseInt(localStorage.getItem("setting_srxd_marqueeSpeed")) * 2);
		rootCSS().setProperty("--cssScrollAmount", `-${extra}px`);
		rootCSS().setProperty("--cssScrollDuration", `${speed}s`);

		console.log(`amount: ${extra}px, speed: ${speed}s`);

		childElement.addClass("cssScroll");
		parentElement.addClass("cssScrollClippingWorkaround");
		secondaryTimer = setTimeout(switchSecondary, (parseInt(localStorage.getItem("setting_srxd_artistMapperCycleDelay")) * 1333) + (speed * 1000)); // yeah idk either
	} else {
		console.log(`${childWidth} < ${parentWidth}`);
		secondaryTimer = setTimeout(switchSecondary, parseInt(localStorage.getItem("setting_srxd_artistMapperCycleDelay")) * 1000);
	}
}

var hideShowTO;
var artState = true;
function toggleOverlay(show) {
	if(localStorage.getItem("setting_srxd_hideOnMenu") === "false") {
		show = true;
	}

	clearTimeout(hideShowTO);
	if(show) {
		//$("#miscInfoCell, #hitMissCell, #accCell, #ppCell, #qrCell, #pbCell, #bsStatusCell, #handValueCell").removeClass("fadeOut").addClass("fadeIn");
		$("#miscInfoCell, #hitMissCell, #scoreCell, #qrCell, #accCell").removeClass("fadeOut").addClass("fadeIn");
		$("#bgWrapper").removeClass("fadeOut").addClass("fadeInLong");
		$("#title").removeClass("slideOut").addClass("slideIn");

		hideShowTO = setTimeout(function() {
			artState = true;
			$("#secondaryWrap").addClass("slideIn").removeClass("slideOut");
			$("#artWrapper").addClass("fadeIn");
			$("#artWrapper").removeClass("fadeOut");
		}, 100);
	} else {
		$("#miscInfoCell, #hitMissCell, #scoreCell, #qrCell, #accCell").removeClass("fadeIn").addClass("fadeOut");
		$("#bgWrapper").removeClass("fadeInLong").addClass("fadeOut");
		$("#title").removeClass("slideIn").addClass("slideOut");

		hideShowTO = setTimeout(function() {
			artState = false;
			$("#secondaryWrap").addClass("slideOut").removeClass("slideIn");
			$("#artWrapper").addClass("fadeOut");
			$("#artWrapper").removeClass("fadeIn");
		}, 100);
	}
}

var oldHealth = 0;
var healthFadeTO;
var showHealth = true;
var alwaysShowHealth = false;
function setHealth(health, forced) {
	if(health > 1) {
		health = 1;
	}

	$(":root").get(0).style.setProperty("--currentHealthAngle", `${health * 360}deg`);

	if(oldHealth !== health) {
		if((health < oldHealth || alwaysShowHealth) && !forced && showHealth) {
			clearTimeout(healthFadeTO);

			$("#healthOutline").fadeIn(100, function() {
				healthFadeTO = setTimeout(function() {
					$("#healthOutline").fadeOut(250);
				}, parseFloat(localStorage.getItem("setting_srxd_healthOutlineTimeout")) * 1000);
			});
		}
	}

	if(health <= 0) {
		if(localStorage.getItem("setting_srxd_enableSkullOnDeath") === "true") {
			$("#skullIcon").fadeIn(250);

			if(localStorage.getItem("setting_srxd_fadeArtOnFailure") === "true") {
				$("#art").addClass("isDead");
			}
		}

		clearTimeout(healthFadeTO);
		$("#healthOutline").fadeOut(250);
	} else {
		$("#skullIcon").hide();
		$("#art").removeClass("isDead");
	}

	oldHealth = health;
}

var timingTextMap = {
	PerfectPlus: "Perfect+",
	Perfect: "Perfect",
	Great: "Great",
	Good: "Good",
	Okay: "Late",
	EarlyOkay: "Early",
	Failed: "Miss",
	Overbeat: "Overbeat"
}

// define an observer instance
var observer = new IntersectionObserver(onIntersection, {
	root: document.querySelector('#timingList'),
	threshold: 0
})

function removeTimingElement(entry) {
	if(entry.intersectionRatio !== 0) {
		return;
	}

	observer.unobserve(entry.target);
	entry.target.remove();
}
// callback is called on intersection change
function onIntersection(entries, opts){
	entries.forEach(entry => 
		removeTimingElement(entry)
	);
}

const animationOptions = {
	direction: "reverse",
	easing: "ease-in",
	duration: 67,
	iterations: 1
}

function scrollTimingElement(index, element) {
	element.animate(
		{
			transform: ["translateY(100%)"]
		},
		animationOptions
	);
}
function scrollNewTimingElement(index, element) {
	element.animate(
		{
			filter: ["brightness(100%)", "brightness(300%) saturate(50%)", "brightness(100%)"]
		},
		animationOptions
	);
	element.firstElementChild.animate(
		{
			transform: ["scaleY(50%) translateY(100%)"],
		},
		animationOptions
	);

	element.animate(
		{
			transform: ["none", "translateY(-50%)"],
			opacity: [1, 0]
		},
		{
			fill: "both",
			easing: "ease-in-out",
			duration: 250,
			iterations: 1,
			delay: 1500
		}
	)
}

// addTimingRow(Object.keys(timingMap)[Math.floor(Math.random() * 6)]);
function addTimingRow(timing) {
	let timingClass = timing.replace("Early", "");
	if(!(timing in timingTextMap)) {
		timing = timing.replace("Early", "");
	}

	const timingRowFilterWrap = $('<div class="timingRowFilterWrap"></div>');

	const timingRow = $('<div class="timingRow"></div>');
	timingRowFilterWrap.append(timingRow);
	timingRow.addClass(`timing${timingClass}`);

	const textElement = $(`<span></span>`);
	textElement.text(timingTextMap[timing]);
	timingRow.append(textElement);

	$.each($(".timingRow"), scrollTimingElement);
	$("#timingList").append(timingRowFilterWrap);
	scrollNewTimingElement(0, timingRowFilterWrap[0]);

	setTimeout(function() {
		observer.observe(timingRowFilterWrap[0]);
	}, 33);
}

currentState = {};
const eventFuncs = {
	"state": function(data) {
		currentState = data;

		if(previousState !== data.state) {
			previousState = data.state;
			togglePause(previousState !== "playing");
		}

		if(data.acc === 1 && !data.hits) {
			let precision = parseInt(localStorage.getItem("setting_srxd_accPrecision"));
			$("#acc").text(`00${precision ? `.${"".padStart(parseInt(precision), "0")}` : ""}`);
		} else {
			setAcc(data.acc * 100);
		}

		if(data.score > 0) {
			setScore(data.score);
		}

		$("#combo").text(data.combo.toLocaleString());

		if(!isNaN(data.score)) {
			setHitMiss(data);
		}

		setHealth(data.health || 0);

		//timerFunction();

		if(data.state === "stopped") {
			toggleOverlay(false);
		} else {
			toggleOverlay(true);
		}
	},

	"hash": function(hash) {
		setHealth(1, true);

		toggleOverlay(true);
		switchSecondary(true);

		rootCSS().setProperty("--art-url", `url('placeholder.png')`);
		$("#art, #artDoppleganger").attr("src", "placeholder.png");

		songLength = 0;
		$("#duration").text("0:00");

		$("#titleString").text("loading...");
		$("#artist").text("please wait...");
		$("#mapperContainer").empty();

		hideMiscInfoDisplayElements();

		$("#combo").text(0);
		$("#hitValue").text(0);
		$("#PFCCell").show();
		$("#FCCell").hide();
		$("#missCell").hide();
		$("#comboWrap").show();
	},

	"map": async function(map) {
		activeMap = map;

		setArt();
		//setQR();
		setDiff();
		setScore(0);
		setAcc(100, true);
		let precision = parseInt(localStorage.getItem("setting_srxd_accPrecision"));
		$("#acc").text(`00${precision ? `.${"".padStart(parseInt(precision), "0")}` : ""}`);

		songLength = Math.ceil(map.song.duration);
		$("#duration").text(formatTime(songLength));

		$("#titleString").text(map.song.title + (map.song.subtitle !== "" ? ` - ${map.song.subtitle}` : ""));

		updateMarquee();

		$("#artist").text(map.song.artist);
		if(map.map.code) {
			$("#spinShareCode").text(map.map.code);
		}

		hideMiscInfoDisplayElements();
		changeMiscInfoDisplay();

		$("#mapperContainer").empty();
		/*if(localStorage.getItem("setting_srxd_forceSpinShareData") === "true") {
			if(map.map.uploaders.length) {
				for(const mapper of map.map.uploaders) {
					let mapperElement = $(`<div class="mapper showComma"></div>`);
					if(mapper.avatar) {
						mapperElement.append($(`<img class="mapperAvatar" src="${mapper.avatar}"/>`))
					}
					mapperElement.append(mapper.name);
					$("#mapperContainer").append(mapperElement);				
				}
				$(".mapper:last-child").removeClass("showComma");
			} else {
				// fallback to internal data, probably a base game map
				$("#mapperContainer").append($(`<div class="mapper">${map.map.author}</div>`));
			}
		} else {*/
			let mapperElement = $(`<div class="mapper"></div>`);
			/*if(map.map.uploaders.length) {
				if(map.map.uploaders[0].avatar) {
					mapperElement.append($(`<img class="mapperAvatar" src="${map.map.uploaders[0].avatar}"/>`))
				}
			}*/
			mapperElement.append(map.map.author);
			$("#mapperContainer").append(mapperElement);
		//}

		updateSecondaryMarquee();
		//refreshLeaderboardData(map.map.difficulty, map.map.characteristic, map.map.hash);

		//map.personalBest = await getPersonalBest(map.map.hash, diffEnum[map.map.difficulty], map.map.characteristic);
		//setPBDisplay(map.personalBest);

		//checkCustomColors();
	},

	"reset": function() {
		elapsed = 0;

		/*currentState.combo = 0;
		currentState.hits = 0;
		currentState.misses = 0;
		currentState.health = 1;
		currentState.score = 0;
		currentState.fcState = "PerfectPlus";

		setHealth(1, true);
		setScore(0);
		setHitMiss(currentState);*/
	},

	"hit": function(type) {
		addTimingRow(type);
	}

	/*"qr": function(qr) {
		activeMap.qrCode = qr;
		setQR();
	}*/
};
function processMessage(data) {
	if(data.type in eventFuncs) {
		eventFuncs[data.type](data.data);
	} else {
		console.log(data);
	}
}

var secondaryTimer;
function switchSecondary(force) {
	clearTimeout(secondaryTimer);

	if(force) {
		$("#mapperContainer").hide();
		$("#artist").show();

		updateSecondaryMarquee();
		return;
	}

	if(localStorage.getItem("setting_srxd_enableArtistMapperCycle") === "true") {
		if($("#artist").is(":visible")) {
			$("#artist").fadeOut(250, function() {
				$("#mapperContainer").fadeIn(250);
				updateSecondaryMarquee();
			})
		} else {
			$("#mapperContainer").fadeOut(250, function() {
				$("#artist").fadeIn(250);
				updateSecondaryMarquee();
			})
		}
	}
}

var miscInfoDisplayTO;
var currentMiscInfoIndex = 0;
const miscInfoWrapElements = [
	"#diffWrap",
	"#codeWrap"
];

function hideMiscInfoDisplayElements() {
	for(const which of miscInfoWrapElements) {
		$(which).hide();
	}
	currentMiscInfoIndex = 0;
}
function changeMiscInfoDisplay() {
	clearTimeout(miscInfoDisplayTO);
	miscInfoDisplayTO = setTimeout(changeMiscInfoDisplay, parseFloat(localStorage.getItem("setting_srxd_miscInfoRotationInterval")) * 1000);

	let allowedToDisplay = [
		(localStorage.getItem("setting_srxd_miscInfoShowDifficulty") === "true"),
		(localStorage.getItem("setting_srxd_miscInfoShowSpinShareKey") === "true")
	]

	if("map" in activeMap) {
		if(!activeMap.map.code) {
			allowedToDisplay[1] = false;
		}
	}

	let partsDisplaying = 0;
	for(let bool of allowedToDisplay) {
		if(bool === true) {
			partsDisplaying++;
		}
	}

	if(!partsDisplaying) {
		for(const which of miscInfoWrapElements) {
			$(which).hide();
		}
		return;
	}

	if(partsDisplaying === 1) {
		for(let idx in allowedToDisplay) {
			let bool = allowedToDisplay[idx];
			if(bool === true) {
				$(miscInfoWrapElements[idx]).fadeIn(250);
				currentMiscInfoIndex = idx;
			} else {
				$(miscInfoWrapElements[idx]).hide();
			}
		}
		return;
	}

	for(let idx = 0; idx < miscInfoWrapElements.length; idx++) {
		if(idx !== currentMiscInfoIndex) {
			$(miscInfoWrapElements[idx]).hide();
		}
	}

	$(miscInfoWrapElements[currentMiscInfoIndex]).fadeOut(250, function() {
		currentMiscInfoIndex++;
		if(currentMiscInfoIndex >= miscInfoWrapElements.length) {
			currentMiscInfoIndex = 0;
		}

		while(allowedToDisplay[currentMiscInfoIndex] === false) {
			currentMiscInfoIndex++;
			if(currentMiscInfoIndex >= miscInfoWrapElements.length) {
				currentMiscInfoIndex = 0;
			}
		}

		$(miscInfoWrapElements[currentMiscInfoIndex]).fadeIn(250);
	});
}

//var elapsedTimers = [];
var elapsed = 0;
//var timerInterval = 500;

/*function timerFunction() {
	elapsed += timerInterval / 1000;

	let perc = (elapsed / songLength);
	if(perc > 1 || localStorage.getItem("setting_srxd_enableArtOutlineProgress") === "false") {
		perc = 1;
	}

	$(":root").get(0).style.setProperty("--currentProgressAngle", `${perc * 360}deg`);

	$("#time").text(formatTime(Math.floor(elapsed)));
}*/
function elapsedTimer() {
	if(isPaused) {
		return;
	}

	elapsed++;
	$("#time").text(formatTime(elapsed));
}
setInterval(elapsedTimer, 1000);

var finalScore = 0;
var curScore = 0;
function setScore(score) {
	finalScore = score

	if(localStorage.getItem("setting_srxd_animateScoreChanges") === "true") {
		if(!isAnimatingScore) {
			animateScoreChange();
		}
	} else {
		curScore = finalScore;
		$("#score").text(finalScore.toLocaleString());
	}
}

var currentScoreInterval = parseInt(localStorage.getItem("setting_srxd_animateScoreInterval"));
var isAnimatingScore = false;
function animateScoreChange() {
	isAnimatingScore = true;

	if(curScore === finalScore) {
		isAnimatingScore = false;
		$("#score").text(finalScore.toLocaleString());
		return;
	}

	const divisor = Math.max(parseInt(localStorage.getItem("setting_srxd_scoreAnimationDivisor")), 1);

	let toChange = finalScore - curScore;
	if(!toChange) {
		isAnimatingScore = false;
		$("#score").text(finalScore.toLocaleString());
		return;
	}

	if(toChange > 0) {
		curScore += Math.ceil(toChange / divisor);
	} else if(toChange < 0) {
		curScore += Math.floor(toChange / divisor);
	}

	$("#score").text(curScore.toLocaleString());

	setTimeout(animateScoreChange, currentScoreInterval);
}

var finalAcc = 100;
var curAcc = 100;
function setAcc(acc, forced = false) {
	const decimalPlaces = parseInt(localStorage.getItem("setting_srxd_accPrecision"));
	const factor = Math.pow(10, decimalPlaces);

	acc = Math.floor(factor * acc) / factor;
	
	finalAcc = parseFloat(acc.toFixed(decimalPlaces));

	if(localStorage.getItem("setting_srxd_animateAccChanges") === "true" && !forced) {
		if(!isAnimatingAcc) {
			animateAccChange();
		}
		return;
	}

	curAcc = finalAcc;
	$("#acc").text(finalAcc.toFixed(decimalPlaces));
}

var currentAccInterval = parseInt(localStorage.getItem("setting_srxd_animateAccInterval"));
var isAnimatingAcc = false;
function animateAccChange() {
	isAnimatingAcc = true;

	const decimalPlaces = parseInt(localStorage.getItem("setting_srxd_accPrecision"));

	if(curAcc === finalAcc) {
		isAnimatingAcc = false;
		$("#acc").text(finalAcc.toFixed(decimalPlaces));
		return;
	}

	const divisor = Math.max(parseInt(localStorage.getItem("setting_srxd_accAnimationDivisor")), 1);
	const factor = Math.pow(divisor, decimalPlaces);

	let toChange = parseFloat((Math.round((finalAcc - curAcc) * factor) / factor).toFixed(decimalPlaces));
	if(!toChange) {
		isAnimatingAcc = false;
		$("#acc").text(finalAcc.toFixed(decimalPlaces));
		return;
	}

	if(toChange > 0) {
		curAcc += Math.ceil((toChange * factor) / divisor) / factor;
	} else if(toChange < 0) {
		curAcc += Math.floor((toChange * factor) / divisor) / factor;
	}

	$("#acc").text(curAcc.toFixed(decimalPlaces));

	setTimeout(animateAccChange, currentAccInterval);
}

var showPerfectPlusHits = localStorage.getItem("setting_srxd_showPerfectPlusHitsIfFC") === "true";
function setHitMiss(state) {
	$("#missValue").text(state.misses.toLocaleString());
	$("#hitValue").text(state.hits.toLocaleString());

	let showPFC = true;
	let showFC = false;

	// redundancy is easier to read
	switch(state.fcState) {
		case "PerfectPlus":
		case "Perfect":
			showPFC = true;
			showFC = false;
			break;

		case "None":
			showPFC = false;
			showFC = false;
			break;

		default:
			showPFC = false;
			showFC = true;
			break;
	}

	if(showPFC) {
		$("#PFCCell").show();
	} else {
		$("#PFCCell").hide();
	}

	if(showFC) {
		$("#FCCell").show();
	} else {
		$("#FCCell").hide();
	}

	if(!showPFC && !showFC) {
		$("#missCell").show();
	} else {
		$("#missCell").hide();
	}

	$("#perfectPlusHits").text(state.perfectPlusHits.toLocaleString());

	if(showPerfectPlusHits && (showPFC || showFC)) {
		$("#comboWrap").hide();
		$("#perfectPlusHitsWrap").show();
	} else {
		$("#comboWrap").show();
		$("#perfectPlusHitsWrap").hide();
	}
}