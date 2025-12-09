const overlayRevision = 4;
const overlayRevisionTimestamp = 1756970934557;

const settingsChannel = new BroadcastChannel("settings_overlay");

function postToSettingsChannel(event, data) {
	let message = {
		event: event
	};
	if(data) {
		message.data = data;
	}

	console.log(message);
	settingsChannel.postMessage(message);
}

const elementMap = {
	"miscInfoCell": ["misc", "info", "miscinfo", "diff", "code", "difficulty", "time", "elapsed"],
	"artCell": ["art", "cover", "coverart", "pic", "picture", "img", "image"],
	"metadataCell": ["meta", "metadata", "song", "map", "track", "title", "which", "data"],
	"hitMissCell": ["hit", "miss", "hitmiss", "hits", "misses", "correct", "wrong", "errors", "error"],
	"accCell": ["acc", "accuracy", "percent", "percentage", "combo"],
	"scoreCell": ["score", "points"],
	//"ppCell": ["pp", "rank", "ranked", "points", "rankpoints", "rankedpoints", "performancepoints", "rankpp"],
	"qrCell": ["qr", "qrcode", "scannable", "scan", "aztec", "pdf", "pdf417"],
	//"pbCell": ["pb", "best", "personalbest", "personal_best", "highscore"],
};

const diffMap = {
	"Easy": "Easy",
	"Normal": "Normal",
	"Hard": "Hard",
	"Expert": "Expert",
	"XD": "XD",
	"RemiXD": "RemiXD"
};

function setDiff() {
	if(!("map" in activeMap)) {
		return;
	}
	$("#diff").text(diffMap[activeMap.map.difficulty] + ("rating" in activeMap.map ? ` (${activeMap.map.rating})` : ""));
}

function getSmoothMatrix(size, threshold) {
	let matrix = [];
	let center = Math.floor(size / 2);
	let highest;

	for(let x = 0; x < size; x++) {
		let row = [];

		for(let y = 0; y < size; y++) {
			// distance formula we love the pythagorean theorem
			let val = Math.sqrt(Math.pow(center - x, 2) + Math.pow(center - y, 2));

			if(!highest) {
				// the corners will always be the furthest away from the center, so get it now
				highest = val;
			}

			// we need an inverted percentage of the highest distance as we *don't* want the corners taken into account for the matrix
			// also threshold it
			let perc = Math.abs((val / highest)-1);
			row[y] = (perc > threshold ? 1 : 0);
		}

		matrix.push(row.join(" "));
	}
	return matrix;
}

var progressivePP = false;
const settingUpdaters = {
	easyDiffName: function(value) {
		diffMap["Easy"] = value;
		setDiff();
	},
	normalDiffName: function(value) {
		diffMap["Normal"] = value;
		setDiff();
	},
	hardDiffName: function(value) {
		diffMap["Hard"] = value;
		setDiff();
	},
	expertDiffName: function(value) {
		diffMap["Expert"] = value;
		setDiff();
	},
	xdDiffName: function(value) {
		diffMap["XD"] = value;
		setDiff();
	},
	remiXDDiffName: function(value) {
		diffMap["RemiXD"] = value;
		setDiff();
	},

	elementOrder: function(value) {
		/* remove `.attr("style", "")` after OBS updates CEF to a recent chrome version */
		$(".cell").attr("data-enabled", "false");
		$(".cell").attr("style", "").hide();
		value = value.toLowerCase();

		const wanted = value.split(",").map((v) => v.trim());

		for(const key of wanted) {
			var foundElement;

			for(const element in elementMap) {
				const valid = elementMap[element];

				if(valid.indexOf(key) === -1) {
					continue;
				} else {
					foundElement = element;
					break;
				}
			}

			if(foundElement) {
				$("#wrapper").append($(`#${foundElement}`))
				$(`#${foundElement}`).attr("data-enabled", "true");
				switch(foundElement) {
					case "qrCell":
						if(activeMap) {
							if("qrCode" in activeMap) {
								if(activeMap.qrCode) {
									$(`#${foundElement}`).show();
								}
							}
						}
						break;

					default:
						$(`#${foundElement}`).show();
						break;
				}
			}
		}

		/* remove after OBS updates CEF to a recent chrome version */
		$(".cell:first").css("padding-left", "0px");
		$(".cell:last").css("padding-right", "0px");
	},
	elementSpacing: function(value) {
		rootCSS().setProperty("--elementSpacing", `${value}px`);
	},

	overlayMarginHorizontal: function(value) {
		rootCSS().setProperty("--overlayMarginHorizontal", `${value}px`);
	},
	overlayMarginVertical: function(value) {
		rootCSS().setProperty("--overlayMarginVertical", `${value}px`);
	},
	overlayHeight: function(value) {
		rootCSS().setProperty("--overlayHeight", `${value}px`);
	},

	enableArtBackground: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-background-art", 'block');
		} else {
			rootCSS().setProperty("--show-background-art", 'none');
		}
	},
	artBackgroundMaskWidth: function(value) {
		rootCSS().setProperty("--background-art-mask-width", `${value}%`);
	},
	artBackgroundMaskHeight: function(value) {
		rootCSS().setProperty("--background-art-mask-height", `${value}%`);
	},
	artBackgroundMaskStart: function(value) {
		rootCSS().setProperty("--background-art-start-at", `${value}%`);
	},
	artBackgroundMaskEnd: function(value) {
		rootCSS().setProperty("--background-art-end-at", `${value}%`);
	},
	artBackgroundBlurAmount: function(value) {
		rootCSS().setProperty("--background-art-blur-amount", `${value}px`);
	},
	artBackgroundOpacity: function(value) {
		rootCSS().setProperty("--background-art-opacity", `${value}%`);
	},
	enableArtBackgroundMask: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--background-art-mask-actual", "var(--background-art-mask)");
			rootCSS().setProperty("--wrapper-padding-bottom", "calc(var(--overlayMarginVertical) * 4)");
		} else {
			rootCSS().setProperty("--background-art-mask-actual", "none");
			rootCSS().setProperty("--wrapper-padding-bottom", "var(--overlayMarginVertical)");
		}
	},
	artOutlineBrightness: function(value) {
		rootCSS().setProperty("--art-outline-brightness", `${value}%`);
	},
	artBorderRadius: function(value) {
		rootCSS().setProperty("--art-border-radius", `${value}px`);
	},
	artSize: function(value) {
		rootCSS().setProperty("--art-size", `${value}px`);
	},
	enableArtOutline: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--show-art-outline", "block");

			if(localStorage.getItem("setting_srxd_enableBoxShadowEffects") === "true") {
				$("#art").removeClass("showBoxShadow");
				$("#artBG").addClass("showBoxShadow");
			}
		} else {
			rootCSS().setProperty("--show-art-outline", "none");

			if(localStorage.getItem("setting_srxd_enableBoxShadowEffects") === "true") {
				$("#artBG").removeClass("showBoxShadow");
				$("#art").addClass("showBoxShadow");
			}
		}
	},
	artOutlineSize: function(value) {
		rootCSS().setProperty("--art-outline-size", `${value}px`);
	},
	enableArtOutlineProgress: function(value) {
		//timerFunction();
	},
	artBackgroundFadeInDuration: function(value) {
		rootCSS().setProperty("--fadeInDurationLong", `${value}s`);
	},
	flipMetadataDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--metadataVerticalAlignment", "column-reverse");
			rootCSS().setProperty("--fixWeirdMetadataAlignmentIssue", "-1px");
		} else {
			rootCSS().setProperty("--metadataVerticalAlignment", "column");
			rootCSS().setProperty("--fixWeirdMetadataAlignmentIssue", "1px");
		}
	},
	flipMiscInfoDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--miscInfoVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--miscInfoVerticalAlignment", "column");
		}
	},
	useRemoteArtURL: function(value) {
		setArt();
	},

	titleFontFamily: function(value) {
		rootCSS().setProperty("--titleFontFamily", value);
	},
	titleFontSize: function(value) {
		rootCSS().setProperty("--titleFontSize", `${value}pt`);
	},
	titleFontWeight: function(value) {
		rootCSS().setProperty("--titleFontWeight", parseInt(value));
	},
	titleAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--titleAdditionalWeight", `${value}px`);
	},
	titleTransform: function(value) {
		rootCSS().setProperty("--titleTransform", value);
	},
	titleColor: function(value) {
		rootCSS().setProperty("--titleColor", value);
	},
	titleFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--titleFontStyle", "italic");
		} else {
			rootCSS().setProperty("--titleFontStyle", "normal");
		}
	},

	artistFontFamily: function(value) {
		rootCSS().setProperty("--secondaryFontFamily", value);
	},
	artistFontSize: function(value) {
		rootCSS().setProperty("--secondaryFontSize", `${value}pt`);
	},
	artistFontWeight: function(value) {
		rootCSS().setProperty("--secondaryFontWeight", parseInt(value));
	},
	artistAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--secondaryAdditionalWeight", `${value}px`);
	},
	artistTransform: function(value) {
		rootCSS().setProperty("--secondaryTransform", value);
	},
	artistFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--secondaryFontStyle", "italic");
		} else {
			rootCSS().setProperty("--secondaryFontStyle", "normal");
		}
	},
	artistColor: function(value) {
		rootCSS().setProperty("--secondaryColorStatic", value);
	},
	artistColorReflectsArtColor: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_srxd_artistColorReflectsArtColorDarker") === "true") {
				rootCSS().setProperty("--secondaryColor", "var(--colorDark)");
			} else {
				rootCSS().setProperty("--secondaryColor", "var(--colorLight)");
			}
		} else {
			rootCSS().setProperty("--secondaryColor", "var(--secondaryColorStatic)");
		}
	},
	artistColorReflectsArtColorDarker: function(value) {
		if(localStorage.getItem("setting_srxd_artistColorReflectsArtColor") === "false") {
			return;
		}

		if(value === "true") {
			rootCSS().setProperty("--secondaryColor", "var(--colorDark)");
		} else {
			rootCSS().setProperty("--secondaryColor", "var(--colorLight)");
		}
	},
	enableArtistMapperCycle: function(value) {
		switchSecondary(true);
	},

	miscInfoWidth: function(value) {
		rootCSS().setProperty("--miscInfoWidth", `${value}px`);
	},
	hitMissWidth: function(value) {
		rootCSS().setProperty("--hitMissWidth", `${value}px`);
	},
	accWidth: function(value) {
		rootCSS().setProperty("--accWidth", `${value}px`);
	},
	scoreWidth: function(value) {
		rootCSS().setProperty("--scoreWidth", `${value}px`);
	},
	flipHitMissDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--hitMissVerticalAlignment", "column-reverse");
		} else {
			rootCSS().setProperty("--hitMissVerticalAlignment", "column");
		}
	},
	flipAccDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--accVerticalAlignment", "column-reverse");
			rootCSS().setProperty("--comboVerticalAlignment", 'end');
			rootCSS().setProperty("--accVerticalOffset", '1px');
		} else {
			rootCSS().setProperty("--accVerticalAlignment", "column");
			rootCSS().setProperty("--comboVerticalAlignment", 'start');
			rootCSS().setProperty("--accVerticalOffset", '-1px');
		}
	},

	enableBoxShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--box-shadow-effects-actual", "var(--box-shadow-effects)");
			rootCSS().setProperty("--box-shadow-effects-not-slim-actual", "var(--box-shadow-effects-not-slim)");
		} else {
			rootCSS().setProperty("--box-shadow-effects-actual", "none");
			rootCSS().setProperty("--box-shadow-effects-not-slim-actual", "none");
		}
	},
	boxShadowColor: function(value) {
		rootCSS().setProperty("--box-shadow-effects-color", value);
	},
	boxShadowXOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-x", `${value}px`);
	},
	boxShadowYOffset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-offset-y", `${value}px`);
	},
	boxShadowBlurRadius: function(value) {
		rootCSS().setProperty("--box-shadow-effects-blur-radius", `${value}px`);
	},
	boxShadowBlurInset: function(value) {
		rootCSS().setProperty("--box-shadow-effects-inset", `${value}px`);
	},

	diffFontSize: function(value) {
		rootCSS().setProperty("--miscInfoFontSize", `${value}pt`);
	},
	timeFontSize: function(value) {
		rootCSS().setProperty("--timeFontSize", `${value}pt`);
	},
	miscInfoColor: function(value) {
		rootCSS().setProperty("--miscInfoColor", value);
	},
	miscInfoFontFamily: function(value) {
		rootCSS().setProperty("--miscInfoFontFamily", value);
	},
	miscInfoFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--miscInfoFontStyle", "italic");
		} else {
			rootCSS().setProperty("--miscInfoFontStyle", "normal");
		}
	},

	hitMissFontFamily: function(value) {
		rootCSS().setProperty("--hitMissFontFamily", value);
	},
	hitMissFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--hitMissFontStyle", "italic");
		} else {
			rootCSS().setProperty("--hitMissFontStyle", "normal");
		}
	},
	hitMissFontWeight: function(value) {
		rootCSS().setProperty("--hitMissFontWeight", value);
	},
	hitMissFontSize: function(value) {
		rootCSS().setProperty("--hitMissFontSize", `${value}pt`);
	},
	hitMissColor: function(value) {
		rootCSS().setProperty("--hitMissColor", value);
	},
	hitIconColor: function(value) {
		rootCSS().setProperty("--hitIconColor", value);
	},
	missIconColor: function(value) {
		rootCSS().setProperty("--missIconColor", value);
	},
	PFCIconColor: function(value) {
		rootCSS().setProperty("--PFCIconColor", value);
	},
	FCIconColor: function(value) {
		rootCSS().setProperty("--FCIconColor", value);
	},

	accColor: function(value) {
		rootCSS().setProperty("--accColor", value);
	},
	accFontFamily: function(value) {
		rootCSS().setProperty("--accFontFamily", value);
	},
	accFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--accFontStyle", "italic");
		} else {
			rootCSS().setProperty("--accFontStyle", "normal");
		}
	},
	accFontSize: function(value) {
		rootCSS().setProperty("--accFontSize", `${value}pt`);
	},
	accFontWeight: function(value) {
		rootCSS().setProperty("--accFontWeight", value);
	},
	accFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--accFontAdditionalWeight", `${value}px`);
	},
	accLetterSpacing: function(value) {
		rootCSS().setProperty("--accCharacterSpacing", `${value}px`);
	},

	scoreColor: function(value) {
		rootCSS().setProperty("--scoreColor", value);
	},
	scoreFontFamily: function(value) {
		rootCSS().setProperty("--scoreFontFamily", value);
	},
	scoreFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--scoreFontStyle", "italic");
		} else {
			rootCSS().setProperty("--scoreFontStyle", "normal");
		}
	},
	scoreFontSize: function(value) {
		rootCSS().setProperty("--scoreFontSize", `${value}pt`);
	},
	scoreFontWeight: function(value) {
		rootCSS().setProperty("--scoreFontWeight", value);
	},
	scoreFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--scoreFontAdditionalWeight", `${value}px`);
	},
	scoreLetterSpacing: function(value) {
		rootCSS().setProperty("--scoreCharacterSpacing", `${value}px`);
	},
	comboColor: function(value) {
		rootCSS().setProperty("--comboColor", value);
	},
	comboFontFamily: function(value) {
		rootCSS().setProperty("--comboFontFamily", value);
	},
	comboFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--comboFontStyle", "italic");
		} else {
			rootCSS().setProperty("--comboFontStyle", "normal");
		}
	},
	comboFontSize: function(value) {
		rootCSS().setProperty("--comboFontSize", `${value}pt`);
	},
	comboFontWeight: function(value) {
		rootCSS().setProperty("--comboFontWeight", value);
	},
	animateScoreInterval: function(value) {
		currentScoreInterval = parseInt(localStorage.getItem("setting_srxd_animateScoreInterval"));
	},
	animateAccInterval: function(value) {
		currentAccInterval = parseInt(localStorage.getItem("setting_bs_animateAccInterval"));
	},

	desaturateOnPause: function(value) {
		if(value === "false") {
			$("body").removeClass("pause");
			return;
		}

		togglePause(previousState !== "playing");
	},
	desaturateAmount: function(value) {
		rootCSS().setProperty("--desaturateAmount", `${value}%`);
	},
	desaturateFadeInDuration: function(value) {
		rootCSS().setProperty("--desaturateFadeInDuration", `${value}s`);
	},
	desaturateFadeOutDuration: function(value) {
		rootCSS().setProperty("--desaturateFadeOutDuration", `${value}s`);
	},
	hideOnMenu: function(value) {
		if("scene" in currentState) {
			toggleOverlay(value === "false" && currentScene === "Menu");
		}
	},

	miscInfoAlignment: function(value) {
		rootCSS().setProperty("--miscInfoAlignment", value);
		updateMarquee();
	},
	metadataAlignment: function(value) {
		rootCSS().setProperty("--metadataAlignment", value);
		updateMarquee();
	},
	hitMissAlignment: function(value) {
		rootCSS().setProperty("--hitMissAlignment", value);
		if(value === "left" || value === "center") {
			rootCSS().setProperty("--hitMissAlignmentDirection", "ltr");
		} else {
			rootCSS().setProperty("--hitMissAlignmentDirection", "rtl");
		}
		updateMarquee();
	},
	scoreAlignment: function(value) {
		rootCSS().setProperty("--scoreAlignment", value);
		if(value === "left" || value === "center") {
			rootCSS().setProperty("--comboAlignmentDirection", "ltr");
		} else {
			rootCSS().setProperty("--comboAlignmentDirection", "rtl");
		}
		updateMarquee();
	},
	accAlignment: function(value) {
		rootCSS().setProperty("--accAlignment", value);
		if(value === "left" || value === "center") {
			rootCSS().setProperty("--comboAlignmentDirection", "ltr");
		} else {
			rootCSS().setProperty("--comboAlignmentDirection", "rtl");
		}
		updateMarquee();
	},

	miscInfoFontWeight: function(value) {
		rootCSS().setProperty("--miscInfoFontWeight", value);
	},
	hitMissFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--hitMissFontAdditionalWeight", `${value}px`);
	},
	comboFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--comboFontAdditionalWeight", `${value}px`);
	},
	secondaryGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--secondaryGradientActual", `var(--secondaryGradient)`);
		} else {
			rootCSS().setProperty("--secondaryGradientActual", `var(--secondaryColor)`);
		}
	},
	secondaryGradientColor: function(value) {
		rootCSS().setProperty("--secondaryGradientColor", value);
	},
	secondaryGradientAngle: function(value) {
		rootCSS().setProperty("--secondaryGradientAngle", `${value}deg`);
	},

	renderArtLower: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--background-art-offset", "var(--background-art-height)");
		} else {
			rootCSS().setProperty("--background-art-offset", "0px");
		}
	},

	metadataLineHeight: function(value) {
		rootCSS().setProperty("--metadataLineHeight", `${value}px`);
	},
	miscInfoLineHeight: function(value) {
		rootCSS().setProperty("--miscInfoLineHeight", `${value}px`);
	},
	hitMissLineHeight: function(value) {
		rootCSS().setProperty("--hitMissLineHeight", `${value}px`);
	},
	scoreLineHeight: function(value) {
		rootCSS().setProperty("--scoreLineHeight", `${value}px`);
	},
	accLineHeight: function(value) {
		rootCSS().setProperty("--accLineHeight", `${value}px`);
	},

	enableShadowEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--shadowStuff", "url(#shadowEffect)");
		} else {
			rootCSS().setProperty("--shadowStuff", "url(#blankEffect)");
		}
	},
	enableOutlineEffects: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--outlineStuff", "url(#outlineEffect)");
		} else {
			rootCSS().setProperty("--outlineStuff", "url(#blankEffect)");
		}
	},
	shadowColor: function(value) {
		rootCSS().setProperty("--overlayShadowColor", value);
	},
	shadowXOffset: function(value) {
		$("#shadowEffect feDropShadow").attr("dx", value);
	},
	shadowYOffset: function(value) {
		$("#shadowEffect feDropShadow").attr("dy", value);
	},
	shadowBlurRadius: function(value) {
		$("#shadowEffect feDropShadow").attr("stdDeviation", value);
	},
	outlineColor: function(value) {
		rootCSS().setProperty("--overlayOutlineColor", value);
	},
	outlineDivisor: function(value) {
		$("feConvolveMatrix").attr("divisor", value);
	},
	outlineOrder: function(value) {
		value = parseInt(value);
		let matrix;
		if(value >= 3 && localStorage.getItem("setting_srxd_outlineStripCorners") === "true") {
			matrix = getSmoothMatrix(value, parseFloat(localStorage.getItem("setting_srxd_outlineThreshold")));
		} else {
			matrix = new Array(Math.pow(value, 2)).fill(1);
		}

		$("feConvolveMatrix").attr("order", `${value},${value}`);
		$("feConvolveMatrix").attr("kernelMatrix", matrix.join(" "));
	},
	outlineStripCorners: function() {
		settingUpdaters.outlineOrder(localStorage.getItem("setting_srxd_outlineOrder"));
	},
	overlayOutlineThreshold: function() {
		settingUpdaters.overlayOutlineOrder(localStorage.getItem("setting_srxd_outlineOrder"));
	},
	
	accPrecision: function(value) {
		value = parseInt(value);

		curAcc = 0;
		if(!currentState.acc) {
			finalAcc = 0;
		} else {
			curAcc = 100;
		}

		if(currentState.scene === "Playing") {
			setAcc(currentState.acc * 100);
		} else {
			$("#acc").text(`00${value ? `.${"".padStart(parseInt(value), "0")}` : ""}`);
		}
	},
	perfectPlusHitsColor: function(value) {
		rootCSS().setProperty("--perfectPlusHitsColor", value);
	},
	perfectPlusHitsFontFamily: function(value) {
		rootCSS().setProperty("--perfectPlusHitsFontFamily", value);
	},
	perfectPlusHitsFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--perfectPlusHitsFontStyle", "italic");
		} else {
			rootCSS().setProperty("--perfectPlusHitsFontStyle", "normal");
		}
	},
	perfectPlusHitsFontSize: function(value) {
		rootCSS().setProperty("--perfectPlusHitsFontSize", `${value}pt`);
	},
	perfectPlusHitsFontWeight: function(value) {
		rootCSS().setProperty("--perfectPlusHitsFontWeight", value);
	},
	perfectPlusHitsFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--perfectPlusHitsFontAdditionalWeight", `${value}px`);
	},
	showPerfectPlusHitsIfFC: function(value) {
		showPerfectPlusHits = (value === "true");

		if(currentState.misses) {
			$("#comboWrap").show();
			$("#perfectPlusHitsWrap").hide();
			return;
		}

		if(value === "true") {
			$("#comboWrap").hide();
			$("#perfectPlusHitsWrap").show();
		} else {
			$("#comboWrap").show();
			$("#perfectPlusHitsWrap").hide();
		}
	},
	perfectPlusHitsHeadTransform: function(value) {
		rootCSS().setProperty("--perfectPlusHitsHeadTransform", value);
	},

	qrHeight: function(value) {
		rootCSS().setProperty("--qrSize", `${value}px`);
	},
	qrPadding: function(value) {
		rootCSS().setProperty("--qrPadding", `${value}px`);
	},
	qrBorderRadius: function(value) {
		rootCSS().setProperty("--qrBorderRadius", `${value}px`);
	},
	qrBrightness: function(value) {
		rootCSS().setProperty("--qrFilters", `invert(${100 - parseFloat(value)}%)`);
	},
	qrOpacity: function(value) {
		rootCSS().setProperty("--qrOpacity", `${value}%`);
	},
	qrBackgroundColor: function(value) {
		rootCSS().setProperty("--qrBGColorStatic", value);
	},
	qrBGColorReflectsArtColor: function(value) {
		if(value === "true") {
			if(localStorage.getItem("setting_srxd_qrBGColorReflectsArtColorDarker") === "true") {
				rootCSS().setProperty("--qrBackgroundColor", "var(--colorDark)");
			} else {
				rootCSS().setProperty("--qrBackgroundColor", "var(--colorLight)");
			}
		} else {
			rootCSS().setProperty("--qrBackgroundColor", "var(--qrBGColorStatic)");
		}
	},
	qrBGColorReflectsArtColorDarker: function(value) {
		if(localStorage.getItem("setting_srxd_qrBGColorReflectsArtColor") === "false") {
			return;
		}

		if(value === "true") {
			rootCSS().setProperty("--qrBackgroundColor", "var(--colorDark)");
		} else {
			rootCSS().setProperty("--qrBackgroundColor", "var(--colorLight)");
		}
	},
	qrGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--qrGradientActual", `var(--qrGradient)`);
		} else {
			rootCSS().setProperty("--qrGradientActual", `unset`);
		}
	},
	qrGradientColor: function(value) {
		rootCSS().setProperty("--qrGradientColor", value);
	},
	qrGradientAngle: function(value) {
		rootCSS().setProperty("--qrGradientAngle", `${value}deg`);
	},

	qrBorder: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--qrBorderActual", "var(--qrBorder)");
		} else {
			rootCSS().setProperty("--qrBorderActual", "0px");
		}
	},
	qrBorderColor: function(value) {
		rootCSS().setProperty("--qrBorderColor", value);
	},
	qrBorderSize: function(value) {
		rootCSS().setProperty("--qrBorderSize", `${value}px`);
	},
	qrBorderStyle: function(value) {
		rootCSS().setProperty("--qrBorderStyle", value);
	},

	enableHealthOutline: function(value) {
		showHealth = (value === "true");
		if(!showHealth) {
			$("#healthOutline").hide();
		}
	},
	healthOutlineFGReflectsArtColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--healthColorForeground", "var(--healthColorForegroundReflected)");
		} else {
			rootCSS().setProperty("--healthColorForeground", "var(--healthColorForegroundStatic)");
		}
	},
	healthOutlineBGReflectsArtColor: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--healthColorBackground", "var(--healthColorBackgroundReflected)");
		} else {
			rootCSS().setProperty("--healthColorBackground", "var(--healthColorBackgroundStatic)");
		}
	},
	healthOutlineInverted: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--healthColorForegroundReflected", "var(--colorDark)");
			rootCSS().setProperty("--healthColorBackgroundReflected", "var(--colorLight)");
		} else {
			rootCSS().setProperty("--healthColorForegroundReflected", "var(--colorLight)");
			rootCSS().setProperty("--healthColorBackgroundReflected", "var(--colorDark)");
		}
	},
	healthOutlineFGColor: function(value) {
		rootCSS().setProperty("--healthColorForegroundStatic", value);
	},
	healthOutlineBGColor: function(value) {
		rootCSS().setProperty("--healthColorBackgroundStatic", value);
	},
	healthOutlineShowsOnAllChanges: function(value) {
		alwaysShowHealth = (value === "true");
	},

	enableSkullOnDeath: function(value) {
		rootCSS().setProperty("--skullIconDisplay", (value === "true" ? "flex" : "none"));
		settingUpdaters["fadeArtOnFailure"](value === "true" ? localStorage.getItem("setting_srxd_fadeArtOnFailure") : "false");

		if(currentState.health <= 0) {
			$("#art").addClass("isDead");
		}
	},
	skullIcon: function(value) {
		$("#skullIcon i").attr("class", "");

		var isRegularKind = false;
		if(value.indexOf("_reg") !== -1) {
			isRegularKind = true;
			value = value.substr(0, value.indexOf("_reg"));
		}

		$("#skullIcon i").addClass(isRegularKind ? "fa-regular" : "fa-solid");
		$("#skullIcon i").addClass(value);
	},
	skullIconSize: function(value) {
		rootCSS().setProperty("--skullIconSize", parseInt(value) / 100);
	},
	skullIconReflectsArtColor: function(value) {
		rootCSS().setProperty("--skullIconColor", `var(${(value === "true" ? "--skullIconColorReflected" : "--skullIconColorStatic")})`);
	},
	skullIconUseDarkerArtColor: function(value) {
		rootCSS().setProperty("--skullIconColorReflected", `var(--color${(value === "true" ? "Dark" : "Light")})`);
	},
	skullIconColor: function(value) {
		rootCSS().setProperty("--skullIconColorStatic", value);
	},
	fadeArtOnFailure: function(value) {
		rootCSS().setProperty("--deathFilters", (value === "true" ? "var(--deathFiltersActual)" : "opacity(1)"));
	},
	fadeArtOnFailureBrightness: function(value) {
		rootCSS().setProperty("--skullBrightnessArtAmount", `${value}%`);
	},
	fadeArtOnFailureContrast: function(value) {
		rootCSS().setProperty("--skullContrastArtAmount", `${value}%`);
	},
	fadeArtOnFailureSaturation: function(value) {
		rootCSS().setProperty("--skullSaturateArtAmount", `${value}%`);
	},
	skullIconUsesOutlineEffect: function(value) {
		rootCSS().setProperty("--skullIconOutlineFilter", (value === "true" ? "url(#outlineEffect)" : "opacity(1)"));
	},
	skullIconUsesShadowEffect: function(value) {
		rootCSS().setProperty("--skullIconShadowFilter", (value === "true" ? "url(#shadowEffect)" : "opacity(1)"));
	},

	/*pbPlayerIdentifier: function(value) {
		if(!value) {
			setPBDisplay(0);
			return;
		}

		if("personalBest" in activeMap) {
			// if it's present, that means a map has been played
			getPersonalBest(activeMap.map.hash, diffEnum[activeMap.map.difficulty], activeMap.map.characteristic).then((data) => {
				activeMap.personalBest = data;
				setPBDisplay(activeMap.personalBest);
			});
		}
	},
	pbHeaderText: function(value) {
		$("#pbHeaderText").text(value);
	},
	pbHeaderColor: function(value) {
		rootCSS().setProperty("--pbHeaderColorStatic", value);
	},
	pbHeaderUsesGradient: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pbHeaderGradient", `var(--pbHeaderGradientActual)`);
		} else {
			rootCSS().setProperty("--pbHeaderGradient", `var(--pbHeaderColor)`);
		}
	},
	pbHeaderGradientColor: function(value) {
		rootCSS().setProperty("--pbHeaderGradientColor", value);
	},
	pbHeaderGradientAngle: function(value) {
		rootCSS().setProperty("--pbHeaderGradientAngle", `${value}deg`);
	},
	pbHeaderReflectsArtColor: function(value) {
		rootCSS().setProperty("--pbHeaderColor", `var(${(value === "true" ? "--pbHeaderColorReflected" : "--pbHeaderColorStatic")})`);
	},
	pbHeaderReflectsArtColorDarker: function(value) {
		rootCSS().setProperty("--pbHeaderColorReflected", `var(--color${(value === "true" ? "Dark" : "Light")})`);
	},
	hidePBCellIfNoScore: function(value) {
		if($("#pbCell").attr("data-enabled") === "true") {
			if(value === "false") {
				$("#pbCell").show();
			}

			if("personalBest" in activeMap) {
				setPBDisplay(activeMap.personalBest);
			}
		}
	},
	pbDisplayGlobalRank: function(value) {
		if(value === "true") {
			$("#pbCell .basicHeader .fa-globe").show();
			$("#pbRankValue").show();
		} else {
			$("#pbCell .basicHeader .fa-globe").hide();
			$("#pbRankValue").hide();			
		}
	},
	pbHeaderGlobeSeparation: function(value) {
		rootCSS().setProperty("--pbHeaderGlobeSeparation", `${value}px`);
	},
	pbWidth: function(value) {
		rootCSS().setProperty("--pbWidth", `${value}px`);
	},
	pbLineHeight: function(value) {
		rootCSS().setProperty("--pbLineHeight", `${value}px`);
	},
	flipPBDetails: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pbVerticalAlignment", "column-reverse");
			rootCSS().setProperty("--pbVerticalOffset", '1px');
		} else {
			rootCSS().setProperty("--pbVerticalAlignment", "column");
			rootCSS().setProperty("--pbVerticalOffset", '-1px');
		}		
	},
	pbAlignment: function(value) {
		rootCSS().setProperty("--pbAlignment", value);
	},
	pbPrecision: function(value) {
		if("personalBest" in activeMap) {
			setPBDisplay(activeMap.personalBest);
		} else {
			setPBDisplay(0);
		}		
	},
	pbAccColor: function(value) {
		rootCSS().setProperty("--pbAccColor", value);
	},
	pbAccFontFamily: function(value) {
		rootCSS().setProperty("--pbAccFontFamily", value);
	},
	pbAccFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pbAccFontStyle", "italic");
		} else {
			rootCSS().setProperty("--pbAccFontStyle", "normal");
		}
	},
	pbAccFontSize: function(value) {
		rootCSS().setProperty("--pbAccFontSize", `${value}pt`);
	},
	pbAccFontWeight: function(value) {
		rootCSS().setProperty("--pbAccFontWeight", value);
	},
	pbAccFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--pbAccFontAdditionalWeight", `${value}px`);
	},
	pbAccLetterSpacing: function(value) {
		rootCSS().setProperty("--pbAccLetterSpacing", `${value}px`);
	},
	pbHeaderFontFamily: function(value) {
		rootCSS().setProperty("--pbHeaderFontFamily", value);
	},
	pbHeaderFontItalic: function(value) {
		if(value === "true") {
			rootCSS().setProperty("--pbHeaderFontStyle", "italic");
		} else {
			rootCSS().setProperty("--pbHeaderFontStyle", "normal");
		}
	},
	pbHeaderFontSize: function(value) {
		rootCSS().setProperty("--pbHeaderFontSize", `${value}pt`);
	},
	pbHeaderFontWeight: function(value) {
		rootCSS().setProperty("--pbHeaderFontWeight", value);
	},
	pbHeaderFontAdditionalWeight: function(value) {
		rootCSS().setProperty("--pbHeaderFontAdditionalWeight", `${value}px`);
	},
	pbLeaderboardContext: function(value) {
		if("personalBest" in activeMap) {
			// if it's present, that means a map has been played
			getPersonalBest(activeMap.map.hash, diffEnum[activeMap.map.difficulty], activeMap.map.characteristic).then((data) => {
				activeMap.personalBest = data;
				setPBDisplay(activeMap.personalBest);
			});
		}		
	},
	pbRankIcon: function(value) {
		if(!("personalBest" in activeMap) && value === "avatar") {
			// we goin too fast
			setTimeout(() => {
				settingUpdaters.pbRankIcon(value);
			}, 1000);
			return;
		}

		$("#pbCell .basicHeader i").attr("class", "");
		$("#pbCell .basicHeader i").hide();
		$("#pbCell .basicHeader #blAvatar").hide();
		$("#pbCell .basicHeader #blIcon").hide();

		switch(value) {
			case "none":
				return;
				break;

			case "avatar":
				$("#pbCell .basicHeader #blAvatar").show();
				return;
				break;

			case "blicon":
				$("#pbCell .basicHeader #blIcon").show();
				return;
				break;
		}

		$("#pbCell .basicHeader i").show();

		var isRegularKind = false;
		if(value.indexOf("_reg") !== -1) {
			isRegularKind = true;
			value = value.substr(0, value.indexOf("_reg"));
		}

		$("#pbCell .basicHeader i").addClass(isRegularKind ? "fa-regular" : "fa-solid");
		$("#pbCell .basicHeader i").addClass(value);
	},*/
	healthOutlinePadding: function(value) {
		rootCSS().setProperty("--healthOutlinePadding", `${value}px`);
	},

	miscInfoTopAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--miscInfoTopAdditionalFontWeight", `${value}px`);
	},
	miscInfoBottomAdditionalFontWeight: function(value) {
		rootCSS().setProperty("--miscInfoBottomAdditionalFontWeight", `${value}px`);
	}
};

function updateSetting(which, value, oldValue) {
	if(which.indexOf("setting_srxd_") === -1) {
		return;
	}

	let setting = which.substr(13);

	if(setting in settingUpdaters) {
		console.log(`setting ${setting} updated`);
		settingUpdaters[setting](value, oldValue);

		rootCSS().setProperty("--background-art-height", `${$("#wrapper").outerHeight(true)}px`);
		rootCSS().setProperty("--background-art-size", `${$('#artBGWrap .artContainer').width()}px`);
	}

	if(setting.toLowerCase().indexOf("marquee") !== -1) {
		updateMarquee();
	}
}
window.addEventListener("storage", function(event) {
	updateSetting(event.key, event.newValue, event.oldValue);
});