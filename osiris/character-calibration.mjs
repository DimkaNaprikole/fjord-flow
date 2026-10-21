// Manual calibration from decoded frame zero; all coordinates normalized to source width/height.
// Do not use unionBounds/props to define physical character size; use those only for visibility.
export const CHARACTER_CALIBRATION = Object.freeze({
  "version": 1,
  "reference": {
    "id": "blink",
    "headWidth": 0.1522248243559719,
    "headWidthPixels": 130,
    "sourceWidth": 854,
    "sourceHeight": 480
  },
  "measurement": "Manually measured cranial/cheek bounds excluding ears, at decoded frame zero; trunk excludes limbs/tail/props. Values are estimates, not a 3D rig. Fixed per-clip scale, never per-frame breathing/zoom.",
  "groundMeasurement": "Approximate visually reviewed support/contact centers at the first and last decoded frame. Excludes props and tail tips; lying poses use body support. A shared anchor alone does not make unmatched postures seamless.",
  "clips": {
    "blink": {
      "head": {
        "cx": 0.5210772833723654,
        "cy": 0.2677083333333333,
        "width": 0.1522248243559719,
        "height": 0.21875,
        "left": 0.4449648711943794,
        "top": 0.15833333333333333,
        "right": 0.5971896955503513,
        "bottom": 0.3770833333333333
      },
      "body": {
        "left": 0.34543325526932084,
        "top": 0.4166666666666667,
        "right": 0.6030444964871194,
        "bottom": 0.8333333333333334,
        "width": 0.2576112412177986,
        "height": 0.4166666666666667
      },
      "ground": {
        "x": 0.5269320843091335,
        "y": 0.9208333333333333
      },
      "pose": "sit-front",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.9229166666666667
      },
      "startBounds": {
        "left": 0.327869,
        "top": 0.0125,
        "right": 0.625293,
        "bottom": 0.922917
      },
      "unionBounds": {
        "left": 0.326698,
        "top": 0.002083,
        "right": 0.631148,
        "bottom": 0.925
      },
      "scaleToReference": 1.0,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "yawn": {
      "head": {
        "cx": 0.5058548009367682,
        "cy": 0.28020833333333334,
        "width": 0.16393442622950818,
        "height": 0.2520833333333333,
        "left": 0.4238875878220141,
        "top": 0.15416666666666667,
        "right": 0.5878220140515222,
        "bottom": 0.40625
      },
      "body": {
        "left": 0.3325526932084309,
        "top": 0.45625,
        "right": 0.6007025761124122,
        "bottom": 0.8833333333333333,
        "width": 0.2681498829039813,
        "height": 0.4270833333333333
      },
      "ground": {
        "x": 0.5,
        "y": 0.9625
      },
      "pose": "sit-front",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5,
        "y": 0.9645833333333333
      },
      "startBounds": {
        "left": 0.313817,
        "top": 0.035417,
        "right": 0.619438,
        "bottom": 0.966667
      },
      "unionBounds": {
        "left": 0.311475,
        "top": 0.0125,
        "right": 0.648712,
        "bottom": 0.966667
      },
      "scaleToReference": 0.9285714285714286,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "listen": {
      "head": {
        "cx": 0.5210772833723654,
        "cy": 0.2677083333333333,
        "width": 0.1522248243559719,
        "height": 0.21875,
        "left": 0.4449648711943794,
        "top": 0.15833333333333333,
        "right": 0.5971896955503513,
        "bottom": 0.3770833333333333
      },
      "body": {
        "left": 0.34543325526932084,
        "top": 0.4166666666666667,
        "right": 0.6030444964871194,
        "bottom": 0.8333333333333334,
        "width": 0.2576112412177986,
        "height": 0.4166666666666667
      },
      "ground": {
        "x": 0.5269320843091335,
        "y": 0.9208333333333333
      },
      "pose": "sit-front",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.9229166666666667
      },
      "startBounds": {
        "left": 0.327869,
        "top": 0.0125,
        "right": 0.625293,
        "bottom": 0.922917
      },
      "unionBounds": {
        "left": 0.320843,
        "top": 0.008333,
        "right": 0.627635,
        "bottom": 0.925
      },
      "scaleToReference": 1.0,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "nose-lick": {
      "head": {
        "cx": 0.5210772833723654,
        "cy": 0.2677083333333333,
        "width": 0.1522248243559719,
        "height": 0.21875,
        "left": 0.4449648711943794,
        "top": 0.15833333333333333,
        "right": 0.5971896955503513,
        "bottom": 0.3770833333333333
      },
      "body": {
        "left": 0.34543325526932084,
        "top": 0.4166666666666667,
        "right": 0.6030444964871194,
        "bottom": 0.8333333333333334,
        "width": 0.2576112412177986,
        "height": 0.4166666666666667
      },
      "ground": {
        "x": 0.5269320843091335,
        "y": 0.9208333333333333
      },
      "pose": "sit-front",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.9229166666666667
      },
      "startBounds": {
        "left": 0.327869,
        "top": 0.0125,
        "right": 0.625293,
        "bottom": 0.922917
      },
      "unionBounds": {
        "left": 0.327869,
        "top": 0.010417,
        "right": 0.631148,
        "bottom": 0.925
      },
      "scaleToReference": 1.0,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "pleading": {
      "head": {
        "cx": 0.5210772833723654,
        "cy": 0.26875,
        "width": 0.1522248243559719,
        "height": 0.2125,
        "left": 0.4449648711943794,
        "top": 0.1625,
        "right": 0.5971896955503513,
        "bottom": 0.375
      },
      "body": {
        "left": 0.40046838407494145,
        "top": 0.4395833333333333,
        "right": 0.5995316159250585,
        "bottom": 0.8270833333333333,
        "width": 0.1990632318501171,
        "height": 0.3875
      },
      "ground": {
        "x": 0.5187353629976581,
        "y": 0.8979166666666667
      },
      "pose": "sit-front-hat",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5187353629976581,
        "y": 0.9145833333333333
      },
      "startBounds": {
        "left": 0.345433,
        "top": 0.0125,
        "right": 0.696721,
        "bottom": 0.914583
      },
      "unionBounds": {
        "left": 0.344262,
        "top": 0.0125,
        "right": 0.697892,
        "bottom": 0.916667
      },
      "scaleToReference": 1.0,
      "confidence": "high",
      "identityContinuity": "context-bound",
      "note": "Hat is held throughout; black eyes and anthropomorphic pose. Context-bound, not a neutral idle transition.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "mouse": {
      "head": {
        "cx": 0.27107728337236536,
        "cy": 0.42916666666666664,
        "width": 0.06206088992974239,
        "height": 0.08333333333333333,
        "left": 0.24004683840749413,
        "top": 0.3875,
        "right": 0.30210772833723654,
        "bottom": 0.4708333333333333
      },
      "body": {
        "left": 0.16276346604215455,
        "top": 0.475,
        "right": 0.27049180327868855,
        "bottom": 0.6166666666666667,
        "width": 0.10772833723653395,
        "height": 0.14166666666666666
      },
      "ground": {
        "x": 0.24707259953161592,
        "y": 0.6458333333333334
      },
      "pose": "sit-three-quarter-right-mouse",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3864168618266979,
        "y": 0.6770833333333334
      },
      "startBounds": {
        "left": 0.141686,
        "top": 0.35625,
        "right": 0.322014,
        "bottom": 0.664583
      },
      "unionBounds": {
        "left": 0.140515,
        "top": 0.354167,
        "right": 0.61007,
        "bottom": 0.691667
      },
      "scaleToReference": 2.452830188679245,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "Starts seated and ends prone, with the toy mouse. Perspective and head angle vary inside the generated source; no standing/get-up transition is present at the end.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "lying-toy": {
      "head": {
        "cx": 0.27107728337236536,
        "cy": 0.42916666666666664,
        "width": 0.06206088992974239,
        "height": 0.08333333333333333,
        "left": 0.24004683840749413,
        "top": 0.3875,
        "right": 0.30210772833723654,
        "bottom": 0.4708333333333333
      },
      "body": {
        "left": 0.16276346604215455,
        "top": 0.475,
        "right": 0.27049180327868855,
        "bottom": 0.6166666666666667,
        "width": 0.10772833723653395,
        "height": 0.14166666666666666
      },
      "ground": {
        "x": 0.24707259953161592,
        "y": 0.6458333333333334
      },
      "pose": "sit-three-quarter-right-mouse",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.29859484777517564,
        "y": 0.6854166666666667
      },
      "startBounds": {
        "left": 0.141686,
        "top": 0.35625,
        "right": 0.322014,
        "bottom": 0.664583
      },
      "unionBounds": {
        "left": 0.063232,
        "top": 0.354167,
        "right": 0.498829,
        "bottom": 0.704167
      },
      "scaleToReference": 2.452830188679245,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "feather": {
      "head": {
        "cx": 0.34250585480093676,
        "cy": 0.3875,
        "width": 0.08782201405152225,
        "height": 0.1375,
        "left": 0.29859484777517564,
        "top": 0.31875,
        "right": 0.3864168618266979,
        "bottom": 0.45625
      },
      "body": {
        "left": 0.20140515222482436,
        "top": 0.4708333333333333,
        "right": 0.36885245901639346,
        "bottom": 0.7375,
        "width": 0.16744730679156908,
        "height": 0.26666666666666666
      },
      "ground": {
        "x": 0.32084309133489464,
        "y": 0.7729166666666667
      },
      "pose": "sit-look-up-right-feather",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.6733021077283372,
        "y": 0.8645833333333334
      },
      "startBounds": {
        "left": 0.172131,
        "top": 0.252083,
        "right": 0.385246,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.092506,
        "top": 0.029167,
        "right": 0.922717,
        "bottom": 0.895833
      },
      "scaleToReference": 1.7333333333333334,
      "confidence": "medium",
      "identityContinuity": "same-character-reference",
      "note": "Upward profile foreshortens the face; feather excluded from body/ground calibration. Finishes looking down. The generated source moves closer to camera; fixed calibration does not remove its internal perspective change.",
      "evidence": "work/life-cutouts/calibration/posters-1.jpg"
    },
    "tail": {
      "head": {
        "cx": 0.5199063231850117,
        "cy": 0.31145833333333334,
        "width": 0.1053864168618267,
        "height": 0.17291666666666666,
        "left": 0.4672131147540984,
        "top": 0.225,
        "right": 0.572599531615925,
        "bottom": 0.39791666666666664
      },
      "body": {
        "left": 0.4449648711943794,
        "top": 0.4375,
        "right": 0.5889929742388759,
        "bottom": 0.7458333333333333,
        "width": 0.14402810304449648,
        "height": 0.30833333333333335
      },
      "ground": {
        "x": 0.5245901639344263,
        "y": 0.7958333333333333
      },
      "pose": "sit-front-narrow",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.43208430913348944,
        "y": 0.7875
      },
      "startBounds": {
        "left": 0.289227,
        "top": 0.135417,
        "right": 0.594848,
        "bottom": 0.802083
      },
      "unionBounds": {
        "left": 0.230679,
        "top": 0.129167,
        "right": 0.681499,
        "bottom": 0.802083
      },
      "scaleToReference": 1.4444444444444444,
      "confidence": "high",
      "identityContinuity": "review-cut",
      "note": "Narrower frontal skull/torso than blink; visible identity/proportion drift. Avoid automatic hard cut from close frontal expressions.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "side-hop": {
      "head": {
        "cx": 0.42096018735363,
        "cy": 0.425,
        "width": 0.06908665105386416,
        "height": 0.10416666666666667,
        "left": 0.3864168618266979,
        "top": 0.3729166666666667,
        "right": 0.45550351288056207,
        "bottom": 0.47708333333333336
      },
      "body": {
        "left": 0.2693208430913349,
        "top": 0.4625,
        "right": 0.4215456674473068,
        "bottom": 0.6291666666666667,
        "width": 0.1522248243559719,
        "height": 0.16666666666666666
      },
      "ground": {
        "x": 0.3559718969555035,
        "y": 0.6708333333333333
      },
      "pose": "crouch-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.509367681498829,
        "y": 0.71875
      },
      "startBounds": {
        "left": 0.208431,
        "top": 0.345833,
        "right": 0.473068,
        "bottom": 0.679167
      },
      "unionBounds": {
        "left": 0.206089,
        "top": 0.24375,
        "right": 0.668618,
        "bottom": 0.722917
      },
      "scaleToReference": 2.2033898305084745,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "paper": {
      "head": {
        "cx": 0.3542154566744731,
        "cy": 0.43854166666666666,
        "width": 0.06440281030444965,
        "height": 0.10625,
        "left": 0.32201405152224827,
        "top": 0.3854166666666667,
        "right": 0.3864168618266979,
        "bottom": 0.49166666666666664
      },
      "body": {
        "left": 0.2505854800936768,
        "top": 0.4895833333333333,
        "right": 0.3594847775175644,
        "bottom": 0.6708333333333333,
        "width": 0.10889929742388758,
        "height": 0.18125
      },
      "ground": {
        "x": 0.32903981264637,
        "y": 0.6854166666666667
      },
      "pose": "sit-three-quarter-right-paper",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.6615925058548009,
        "y": 0.8416666666666667
      },
      "startBounds": {
        "left": 0.227166,
        "top": 0.375,
        "right": 0.407494,
        "bottom": 0.69375
      },
      "unionBounds": {
        "left": 0.223653,
        "top": 0.372917,
        "right": 0.905152,
        "bottom": 0.845833
      },
      "scaleToReference": 2.3636363636363638,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "Starts seated and ends prone, with the paper ball. The generated source moves closer to camera; fixed calibration does not remove its internal perspective change.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "yarn": {
      "head": {
        "cx": 0.3524590163934426,
        "cy": 0.3,
        "width": 0.13114754098360656,
        "height": 0.175,
        "left": 0.28688524590163933,
        "top": 0.2125,
        "right": 0.4180327868852459,
        "bottom": 0.3875
      },
      "body": {
        "left": 0.12177985948477751,
        "top": 0.4166666666666667,
        "right": 0.36885245901639346,
        "bottom": 0.78125,
        "width": 0.24707259953161592,
        "height": 0.3645833333333333
      },
      "ground": {
        "x": 0.275175644028103,
        "y": 0.8125
      },
      "pose": "sit-three-quarter-right-yarn",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.550351288056206,
        "y": 0.8375
      },
      "startBounds": {
        "left": 0.083138,
        "top": 0.127083,
        "right": 0.4637,
        "bottom": 0.820833
      },
      "unionBounds": {
        "left": 0.044496,
        "top": 0.125,
        "right": 0.936768,
        "bottom": 0.872917
      },
      "scaleToReference": 1.1607142857142858,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "groom": {
      "head": {
        "cx": 0.5210772833723654,
        "cy": 0.2677083333333333,
        "width": 0.1522248243559719,
        "height": 0.21875,
        "left": 0.4449648711943794,
        "top": 0.15833333333333333,
        "right": 0.5971896955503513,
        "bottom": 0.3770833333333333
      },
      "body": {
        "left": 0.34543325526932084,
        "top": 0.4166666666666667,
        "right": 0.6030444964871194,
        "bottom": 0.8333333333333334,
        "width": 0.2576112412177986,
        "height": 0.4166666666666667
      },
      "ground": {
        "x": 0.5269320843091335,
        "y": 0.9208333333333333
      },
      "pose": "sit-front",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.9229166666666667
      },
      "startBounds": {
        "left": 0.327869,
        "top": 0.0125,
        "right": 0.625293,
        "bottom": 0.922917
      },
      "unionBounds": {
        "left": 0.318501,
        "top": 0.010417,
        "right": 0.688525,
        "bottom": 0.925
      },
      "scaleToReference": 1.0,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "cursor-button": {
      "head": {
        "cx": 0.3079625292740047,
        "cy": 0.33645833333333336,
        "width": 0.1053864168618267,
        "height": 0.14375,
        "left": 0.25526932084309134,
        "top": 0.26458333333333334,
        "right": 0.36065573770491804,
        "bottom": 0.4083333333333333
      },
      "body": {
        "left": 0.13114754098360656,
        "top": 0.4354166666666667,
        "right": 0.3255269320843091,
        "bottom": 0.7125,
        "width": 0.19437939110070257,
        "height": 0.27708333333333335
      },
      "ground": {
        "x": 0.27985948477751754,
        "y": 0.75625
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.8166666666666667
      },
      "startBounds": {
        "left": 0.105386,
        "top": 0.216667,
        "right": 0.394614,
        "bottom": 0.772917
      },
      "unionBounds": {
        "left": 0.067916,
        "top": 0.214583,
        "right": 0.850117,
        "bottom": 0.845833
      },
      "scaleToReference": 1.4444444444444444,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "cursor": {
      "head": {
        "cx": 0.3079625292740047,
        "cy": 0.33645833333333336,
        "width": 0.1053864168618267,
        "height": 0.14375,
        "left": 0.25526932084309134,
        "top": 0.26458333333333334,
        "right": 0.36065573770491804,
        "bottom": 0.4083333333333333
      },
      "body": {
        "left": 0.13114754098360656,
        "top": 0.4354166666666667,
        "right": 0.3255269320843091,
        "bottom": 0.7125,
        "width": 0.19437939110070257,
        "height": 0.27708333333333335
      },
      "ground": {
        "x": 0.27985948477751754,
        "y": 0.75625
      },
      "pose": "sit-three-quarter-right-cursor",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5269320843091335,
        "y": 0.8166666666666667
      },
      "startBounds": {
        "left": 0.105386,
        "top": 0.216667,
        "right": 0.394614,
        "bottom": 0.772917
      },
      "unionBounds": {
        "left": 0.067916,
        "top": 0.214583,
        "right": 0.921546,
        "bottom": 0.94375
      },
      "scaleToReference": 1.4444444444444444,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "sniff": {
      "head": {
        "cx": 0.3114754098360656,
        "cy": 0.3385416666666667,
        "width": 0.10772833723653395,
        "height": 0.14791666666666667,
        "left": 0.2576112412177986,
        "top": 0.26458333333333334,
        "right": 0.36533957845433257,
        "bottom": 0.4125
      },
      "body": {
        "left": 0.13934426229508196,
        "top": 0.44166666666666665,
        "right": 0.32903981264637,
        "bottom": 0.7333333333333333,
        "width": 0.18969555035128804,
        "height": 0.2916666666666667
      },
      "ground": {
        "x": 0.28688524590163933,
        "y": 0.78125
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3149882903981265,
        "y": 0.8020833333333334
      },
      "startBounds": {
        "left": 0.11007,
        "top": 0.225,
        "right": 0.401639,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.106557,
        "top": 0.1,
        "right": 0.614754,
        "bottom": 0.820833
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-2.jpg"
    },
    "rub": {
      "head": {
        "cx": 0.38173302107728335,
        "cy": 0.38125,
        "width": 0.07728337236533958,
        "height": 0.12083333333333333,
        "left": 0.3430913348946136,
        "top": 0.32083333333333336,
        "right": 0.4203747072599532,
        "bottom": 0.44166666666666665
      },
      "body": {
        "left": 0.20608899297423888,
        "top": 0.3958333333333333,
        "right": 0.3618266978922717,
        "bottom": 0.5604166666666667,
        "width": 0.1557377049180328,
        "height": 0.16458333333333333
      },
      "ground": {
        "x": 0.29508196721311475,
        "y": 0.7020833333333333
      },
      "pose": "stand-right-post",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.29508196721311475,
        "y": 0.7020833333333333
      },
      "startBounds": {
        "left": 0.154567,
        "top": 0.258333,
        "right": 0.478923,
        "bottom": 0.7125
      },
      "unionBounds": {
        "left": 0.099532,
        "top": 0.197917,
        "right": 0.482436,
        "bottom": 0.7125
      },
      "scaleToReference": 1.9696969696969697,
      "confidence": "high",
      "identityContinuity": "context-bound",
      "note": "Post and base excluded from cat landmarks but must remain visible; prop-bound scene.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "scratch": {
      "head": {
        "cx": 0.2968384074941452,
        "cy": 0.41875,
        "width": 0.06674473067915691,
        "height": 0.11666666666666667,
        "left": 0.26346604215456676,
        "top": 0.36041666666666666,
        "right": 0.33021077283372363,
        "bottom": 0.47708333333333336
      },
      "body": {
        "left": 0.18032786885245902,
        "top": 0.5,
        "right": 0.3360655737704918,
        "bottom": 0.6875,
        "width": 0.1557377049180328,
        "height": 0.1875
      },
      "ground": {
        "x": 0.275175644028103,
        "y": 0.71875
      },
      "pose": "sit-head-up-right-paw-at-ear",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.275175644028103,
        "y": 0.725
      },
      "startBounds": {
        "left": 0.13466,
        "top": 0.295833,
        "right": 0.345433,
        "bottom": 0.727083
      },
      "unionBounds": {
        "left": 0.133489,
        "top": 0.270833,
        "right": 0.346604,
        "bottom": 0.729167
      },
      "scaleToReference": 2.280701754385965,
      "confidence": "medium",
      "identityContinuity": "same-character-reference",
      "note": "Starts with hind paw already raised. Upward face angle makes scale less certain.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "knead": {
      "head": {
        "cx": 0.3788056206088993,
        "cy": 0.421875,
        "width": 0.12295081967213115,
        "height": 0.16458333333333333,
        "left": 0.31733021077283374,
        "top": 0.33958333333333335,
        "right": 0.44028103044496486,
        "bottom": 0.5041666666666667
      },
      "body": {
        "left": 0.14754098360655737,
        "top": 0.3,
        "right": 0.40749414519906324,
        "bottom": 0.65625,
        "width": 0.25995316159250587,
        "height": 0.35625
      },
      "ground": {
        "x": 0.3044496487119438,
        "y": 0.74375
      },
      "pose": "crouch-front-right-forepaw-raised",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3044496487119438,
        "y": 0.7645833333333333
      },
      "startBounds": {
        "left": 0.103044,
        "top": 0.177083,
        "right": 0.510539,
        "bottom": 0.758333
      },
      "unionBounds": {
        "left": 0.087822,
        "top": 0.172917,
        "right": 0.525761,
        "bottom": 0.766667
      },
      "scaleToReference": 1.2380952380952381,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "Starts crouched with one forepaw lifted; frontal foreshortening, not a neutral standing start.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "shake": {
      "head": {
        "cx": 0.3114754098360656,
        "cy": 0.3385416666666667,
        "width": 0.10772833723653395,
        "height": 0.14791666666666667,
        "left": 0.2576112412177986,
        "top": 0.26458333333333334,
        "right": 0.36533957845433257,
        "bottom": 0.4125
      },
      "body": {
        "left": 0.13934426229508196,
        "top": 0.44166666666666665,
        "right": 0.32903981264637,
        "bottom": 0.7333333333333333,
        "width": 0.18969555035128804,
        "height": 0.2916666666666667
      },
      "ground": {
        "x": 0.28688524590163933,
        "y": 0.78125
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.28688524590163933,
        "y": 0.8
      },
      "startBounds": {
        "left": 0.11007,
        "top": 0.225,
        "right": 0.401639,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.058548,
        "top": 0.135417,
        "right": 0.535129,
        "bottom": 0.80625
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "body-groom": {
      "head": {
        "cx": 0.3114754098360656,
        "cy": 0.3385416666666667,
        "width": 0.10772833723653395,
        "height": 0.14791666666666667,
        "left": 0.2576112412177986,
        "top": 0.26458333333333334,
        "right": 0.36533957845433257,
        "bottom": 0.4125
      },
      "body": {
        "left": 0.13934426229508196,
        "top": 0.44166666666666665,
        "right": 0.32903981264637,
        "bottom": 0.7333333333333333,
        "width": 0.18969555035128804,
        "height": 0.2916666666666667
      },
      "ground": {
        "x": 0.28688524590163933,
        "y": 0.78125
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.2786885245901639,
        "y": 0.7979166666666667
      },
      "startBounds": {
        "left": 0.11007,
        "top": 0.225,
        "right": 0.401639,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.107728,
        "top": 0.202083,
        "right": 0.403981,
        "bottom": 0.797917
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "stretch": {
      "head": {
        "cx": 0.3114754098360656,
        "cy": 0.3385416666666667,
        "width": 0.10772833723653395,
        "height": 0.14791666666666667,
        "left": 0.2576112412177986,
        "top": 0.26458333333333334,
        "right": 0.36533957845433257,
        "bottom": 0.4125
      },
      "body": {
        "left": 0.13934426229508196,
        "top": 0.44166666666666665,
        "right": 0.32903981264637,
        "bottom": 0.7333333333333333,
        "width": 0.18969555035128804,
        "height": 0.2916666666666667
      },
      "ground": {
        "x": 0.28688524590163933,
        "y": 0.78125
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.32786885245901637,
        "y": 0.8083333333333333
      },
      "startBounds": {
        "left": 0.11007,
        "top": 0.225,
        "right": 0.401639,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.079625,
        "top": 0.172917,
        "right": 0.606557,
        "bottom": 0.81875
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "ledge-reach": {
      "head": {
        "cx": 0.46955503512880564,
        "cy": 0.31666666666666665,
        "width": 0.08665105386416862,
        "height": 0.11666666666666667,
        "left": 0.4262295081967213,
        "top": 0.25833333333333336,
        "right": 0.5128805620608899,
        "bottom": 0.375
      },
      "body": {
        "left": 0.25526932084309134,
        "top": 0.22083333333333333,
        "right": 0.4566744730679157,
        "bottom": 0.42291666666666666,
        "width": 0.20140515222482436,
        "height": 0.20208333333333334
      },
      "ground": {
        "x": 0.351288056206089,
        "y": 0.5625
      },
      "pose": "stand-right-platform",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3805620608899297,
        "y": 0.5625
      },
      "startBounds": {
        "left": 0.103044,
        "top": 0.1625,
        "right": 0.552693,
        "bottom": 0.7125
      },
      "unionBounds": {
        "left": 0.103044,
        "top": 0.1625,
        "right": 0.626464,
        "bottom": 0.716667
      },
      "scaleToReference": 1.7567567567567568,
      "confidence": "high",
      "identityContinuity": "context-bound",
      "note": "Ground is the top of the platform at the cat's paws, not the bottom of the platform.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "look-back": {
      "head": {
        "cx": 0.43559718969555034,
        "cy": 0.32916666666666666,
        "width": 0.07494145199063232,
        "height": 0.125,
        "left": 0.3981264637002342,
        "top": 0.26666666666666666,
        "right": 0.47306791569086654,
        "bottom": 0.39166666666666666
      },
      "body": {
        "left": 0.27049180327868855,
        "top": 0.36666666666666664,
        "right": 0.45784543325526933,
        "bottom": 0.6270833333333333,
        "width": 0.1873536299765808,
        "height": 0.2604166666666667
      },
      "ground": {
        "x": 0.3665105386416862,
        "y": 0.7520833333333333
      },
      "pose": "stand-back-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3665105386416862,
        "y": 0.7645833333333333
      },
      "startBounds": {
        "left": 0.155738,
        "top": 0.210417,
        "right": 0.492974,
        "bottom": 0.764583
      },
      "unionBounds": {
        "left": 0.151054,
        "top": 0.197917,
        "right": 0.494145,
        "bottom": 0.766667
      },
      "scaleToReference": 2.03125,
      "confidence": "medium",
      "identityContinuity": "same-character-reference",
      "note": "Rear three-quarter view; head width is an estimate. Body stays facing away; this is not a full-body turn.",
      "evidence": "work/life-cutouts/calibration/posters-3.jpg"
    },
    "roll": {
      "head": {
        "cx": 0.5731850117096019,
        "cy": 0.5239583333333333,
        "width": 0.05737704918032787,
        "height": 0.08958333333333333,
        "left": 0.544496487119438,
        "top": 0.4791666666666667,
        "right": 0.6018735362997658,
        "bottom": 0.56875
      },
      "body": {
        "left": 0.3747072599531616,
        "top": 0.46458333333333335,
        "right": 0.5433255269320844,
        "bottom": 0.575,
        "width": 0.1686182669789227,
        "height": 0.11041666666666666
      },
      "ground": {
        "x": 0.468384074941452,
        "y": 0.58125
      },
      "pose": "lie-side-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.468384074941452,
        "y": 0.5854166666666667
      },
      "startBounds": {
        "left": 0.285714,
        "top": 0.427083,
        "right": 0.638173,
        "bottom": 0.585417
      },
      "unionBounds": {
        "left": 0.172131,
        "top": 0.372917,
        "right": 0.641686,
        "bottom": 0.595833
      },
      "scaleToReference": 2.6530612244897958,
      "confidence": "medium",
      "identityContinuity": "same-character-reference",
      "note": "Small lying reference; head is rotated. Use this fixed physical scale, never fit lying height to standing height.",
      "evidence": "work/life-cutouts/calibration/posters-4.jpg"
    },
    "lie-down": {
      "head": {
        "cx": 0.3114754098360656,
        "cy": 0.3385416666666667,
        "width": 0.10772833723653395,
        "height": 0.14791666666666667,
        "left": 0.2576112412177986,
        "top": 0.26458333333333334,
        "right": 0.36533957845433257,
        "bottom": 0.4125
      },
      "body": {
        "left": 0.13934426229508196,
        "top": 0.44166666666666665,
        "right": 0.32903981264637,
        "bottom": 0.7333333333333333,
        "width": 0.18969555035128804,
        "height": 0.2916666666666667
      },
      "ground": {
        "x": 0.28688524590163933,
        "y": 0.78125
      },
      "pose": "sit-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.3629976580796253,
        "y": 0.80625
      },
      "startBounds": {
        "left": 0.11007,
        "top": 0.225,
        "right": 0.401639,
        "bottom": 0.797917
      },
      "unionBounds": {
        "left": 0.04918,
        "top": 0.225,
        "right": 0.688525,
        "bottom": 0.808333
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "First/last decoded poses verified; head width ignores ears, toys and frame padding.",
      "evidence": "work/life-cutouts/calibration/posters-4.jpg"
    },
    "arched-back": {
      "head": {
        "cx": 0.6381733021077284,
        "cy": 0.42604166666666665,
        "width": 0.08665105386416862,
        "height": 0.12708333333333333,
        "left": 0.594847775175644,
        "top": 0.3625,
        "right": 0.6814988290398126,
        "bottom": 0.4895833333333333
      },
      "body": {
        "left": 0.3548009367681499,
        "top": 0.32083333333333336,
        "right": 0.5960187353629977,
        "bottom": 0.5583333333333333,
        "width": 0.24121779859484777,
        "height": 0.2375
      },
      "ground": {
        "x": 0.4847775175644028,
        "y": 0.7395833333333334
      },
      "pose": "stand-right-arched",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.4847775175644028,
        "y": 0.74375
      },
      "startBounds": {
        "left": 0.216628,
        "top": 0.2875,
        "right": 0.696721,
        "bottom": 0.74375
      },
      "unionBounds": {
        "left": 0.206089,
        "top": 0.25,
        "right": 0.700234,
        "bottom": 0.74375
      },
      "scaleToReference": 1.7567567567567568,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "Tense alert arch and brief open mouth; retain manual-only behavior.",
      "evidence": "work/life-cutouts/calibration/posters-4.jpg"
    },
    "rear-leg-stretch": {
      "head": {
        "cx": 0.6264637002341921,
        "cy": 0.37083333333333335,
        "width": 0.09601873536299765,
        "height": 0.14166666666666666,
        "left": 0.5784543325526932,
        "top": 0.3,
        "right": 0.6744730679156908,
        "bottom": 0.44166666666666665
      },
      "body": {
        "left": 0.37236533957845436,
        "top": 0.375,
        "right": 0.6182669789227166,
        "bottom": 0.5583333333333333,
        "width": 0.2459016393442623,
        "height": 0.18333333333333332
      },
      "ground": {
        "x": 0.522248243559719,
        "y": 0.7479166666666667
      },
      "pose": "stand-right-hindleg-raised",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.522248243559719,
        "y": 0.7645833333333333
      },
      "startBounds": {
        "left": 0.271663,
        "top": 0.195833,
        "right": 0.700234,
        "bottom": 0.764583
      },
      "unionBounds": {
        "left": 0.233021,
        "top": 0.177083,
        "right": 0.711944,
        "bottom": 0.766667
      },
      "scaleToReference": 1.5853658536585367,
      "confidence": "high",
      "identityContinuity": "same-character-reference",
      "note": "Starts with hind leg already raised; not a neutral standing introduction.",
      "evidence": "work/life-cutouts/calibration/posters-4.jpg"
    },
    "jump-panther-short": {
      "head": {
        "cx": 0.4203747072599532,
        "cy": 0.453125,
        "width": 0.10772833723653395,
        "height": 0.13125,
        "left": 0.3665105386416862,
        "top": 0.3875,
        "right": 0.47423887587822017,
        "bottom": 0.51875
      },
      "body": {
        "left": 0.0936768149882904,
        "top": 0.3541666666666667,
        "right": 0.373536299765808,
        "bottom": 0.5979166666666667,
        "width": 0.27985948477751754,
        "height": 0.24375
      },
      "ground": {
        "x": 0.2259953161592506,
        "y": 0.73125
      },
      "pose": "stand-low-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 480
      },
      "endGround": {
        "x": 0.5035128805620609,
        "y": 0.7416666666666667
      },
      "startBounds": {
        "left": 0.026932,
        "top": 0.2125,
        "right": 0.484778,
        "bottom": 0.735417
      },
      "unionBounds": {
        "left": 0.001171,
        "top": 0.210417,
        "right": 0.766979,
        "bottom": 0.747917
      },
      "scaleToReference": 1.4130434782608696,
      "confidence": "medium",
      "identityContinuity": "manual-only",
      "note": "More realistic side profile, dark eye and pendant collar differ from frontal Osiris. Manual-only continuity recommendation; one short jump ends in a low stance, no recovery run.",
      "evidence": "work/life-cutouts/calibration/posters-4.jpg"
    },
    "walk": {
      "head": {
        "left": 0.59375,
        "top": 0.2814814814814815,
        "right": 0.7541666666666667,
        "bottom": 0.5148148148148148,
        "cx": 0.6739583333333333,
        "cy": 0.39814814814814814,
        "width": 0.16041666666666668,
        "height": 0.23333333333333334
      },
      "body": {
        "left": 0.3125,
        "top": 0.36666666666666664,
        "right": 0.5895833333333333,
        "bottom": 0.7111111111111111,
        "width": 0.27708333333333335,
        "height": 0.34444444444444444
      },
      "ground": {
        "x": 0.5208333333333334,
        "y": 0.9555555555555556
      },
      "endGround": {
        "x": 0.475,
        "y": 0.9555555555555556
      },
      "pose": "walk-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 480,
        "height": 270
      },
      "startBounds": {
        "left": 0.15,
        "top": 0.14814814814814814,
        "right": 0.76875,
        "bottom": 0.9555555555555556
      },
      "unionBounds": {
        "left": 0.13541666666666666,
        "top": 0.1111111111111111,
        "right": 0.7708333333333334,
        "bottom": 0.9555555555555556
      },
      "scaleToReference": 1.6883116883116882,
      "confidence": "medium",
      "identityContinuity": "review-cut",
      "collection": "legacy-motion-bridge",
      "source": "../media/osiris-motion/walk.webp",
      "frameCount": 83,
      "duration": 5.229,
      "note": "Real right-facing walk in place. First and last frames are mid-stride, not neutral standing. Legacy light is greyer than the newer frontal portrait; this is neither a run nor a full turn. No primary media metadata was changed.",
      "evidence": "work/life-cutouts/calibration/legacy-walk.jpg"
    },
    "cloud-perch": {
      "head": {
        "left": 0.20707964601769913,
        "top": 0.16666666666666666,
        "right": 0.3548672566371681,
        "bottom": 0.32666666666666666,
        "cx": 0.2809734513274336,
        "cy": 0.24666666666666667,
        "width": 0.14778761061946902,
        "height": 0.16
      },
      "body": {
        "left": 0.3274336283185841,
        "top": 0.21555555555555556,
        "right": 0.7,
        "bottom": 0.5455555555555556,
        "width": 0.37256637168141593,
        "height": 0.33
      },
      "ground": {
        "x": 0.4831858407079646,
        "y": 0.6
      },
      "endGround": {
        "x": 0.4389380530973451,
        "y": 0.6611111111111111
      },
      "pose": "sit-left-on-cloud",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 1130,
        "height": 900
      },
      "startBounds": {
        "left": 0.15752212389380532,
        "top": 0.04555555555555556,
        "right": 0.9725663716814159,
        "bottom": 0.9155555555555556
      },
      "unionBounds": {
        "left": 0.09292035398230089,
        "top": 0.04555555555555556,
        "right": 0.9725663716814159,
        "bottom": 0.9155555555555556
      },
      "stageScope": "one-shot",
      "scaleToReference": 0.7784431137724551,
      "confidence": "medium",
      "identityContinuity": "owner-provided-sphynx-video",
      "note": "Approximate cranial bounds exclude ears. Foot-support centers visually measured at decoded first/last frame; cloud is a prop below the support. Fixed clip scale; full decoded alpha trajectory includes a 2px margin. One continuous crouch on its own cloud, not a complete jump or a loop. The original small marker near the paw remains; later marked frames were excluded."
    },
    "run-short": {
      "head": {
        "left": 0.26,
        "top": 0.42857142857142855,
        "right": 0.3243478260869565,
        "bottom": 0.56,
        "cx": 0.2921739130434783,
        "cy": 0.4942857142857143,
        "width": 0.06434782608695652,
        "height": 0.13142857142857142
      },
      "body": {
        "left": 0.10434782608695652,
        "top": 0.35428571428571426,
        "right": 0.25565217391304346,
        "bottom": 0.6457142857142857,
        "width": 0.15130434782608695,
        "height": 0.2914285714285714
      },
      "ground": {
        "x": 0.19130434782608696,
        "y": 0.8228571428571428
      },
      "endGround": {
        "x": 0.4782608695652174,
        "y": 0.8142857142857143
      },
      "pose": "run-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 1150,
        "height": 350
      },
      "startBounds": {
        "left": 0.042608695652173914,
        "top": 0.1457142857142857,
        "right": 0.32608695652173914,
        "bottom": 0.8314285714285714
      },
      "unionBounds": {
        "left": 0.042608695652173914,
        "top": 0.11714285714285715,
        "right": 0.6165217391304347,
        "bottom": 0.8314285714285714
      },
      "stageScope": "one-shot",
      "scaleToReference": 1.7567567567567568,
      "confidence": "medium",
      "identityContinuity": "owner-provided-sphynx-video",
      "note": "Approximate cranial bounds exclude ears. Foot-support centers visually measured at decoded first/last frame; cloud is a prop below the support. Fixed clip scale; full decoded alpha trajectory includes a 2px margin. One short native run. Start and end phases differ; do not repeat as a seamless walk or add a second CSS travel path."
    },
    "descent-short": {
      "head": {
        "left": 0.6537037037037037,
        "top": 0.41940298507462687,
        "right": 0.7907407407407407,
        "bottom": 0.49850746268656715,
        "cx": 0.7222222222222222,
        "cy": 0.458955223880597,
        "width": 0.13703703703703704,
        "height": 0.0791044776119403
      },
      "body": {
        "left": 0.3888888888888889,
        "top": 0.3597014925373134,
        "right": 0.65,
        "bottom": 0.5298507462686567,
        "width": 0.2611111111111111,
        "height": 0.1701492537313433
      },
      "ground": {
        "x": 0.6166666666666667,
        "y": 0.5940298507462687
      },
      "endGround": {
        "x": 0.26851851851851855,
        "y": 0.8059701492537313
      },
      "pose": "stand-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 540,
        "height": 670
      },
      "startBounds": {
        "left": 0.2796296296296296,
        "top": 0.3044776119402985,
        "right": 0.8240740740740741,
        "bottom": 0.6074626865671642
      },
      "unionBounds": {
        "left": 0.1648148148148148,
        "top": 0.14328358208955225,
        "right": 0.8351851851851851,
        "bottom": 0.908955223880597
      },
      "stageScope": "one-shot",
      "scaleToReference": 1.7567567567567568,
      "confidence": "medium",
      "identityContinuity": "owner-provided-sphynx-video",
      "note": "Approximate cranial bounds exclude ears. Foot-support centers visually measured at decoded first/last frame; cloud is a prop below the support. Fixed clip scale; full decoded alpha trajectory includes a 2px margin. One native descent with source camera perspective. The last tail-tip blur is retained. Start and end poses differ; not a loop or an interaction with an arbitrary site ledge."
    },
    "window-hop-cloud": {
      "head": {
        "left": 0.351288056206089,
        "top": 0.4803921568627451,
        "right": 0.47423887587822017,
        "bottom": 0.6764705882352942,
        "cx": 0.4127634660421546,
        "cy": 0.5784313725490197,
        "width": 0.12295081967213115,
        "height": 0.19607843137254902
      },
      "body": {
        "left": 0.13114754098360656,
        "top": 0.49264705882352944,
        "right": 0.373536299765808,
        "bottom": 0.8627450980392157,
        "width": 0.2423887587822014,
        "height": 0.3700980392156863
      },
      "ground": {
        "x": 0.29859484777517564,
        "y": 0.9558823529411765
      },
      "endGround": {
        "x": 0.7084309133489461,
        "y": 0.9705882352941176
      },
      "pose": "crouch-three-quarter-right",
      "referenceFrame": 0,
      "sourceSize": {
        "width": 854,
        "height": 408
      },
      "startBounds": {
        "left": 0.0234192037470726,
        "top": 0.32598039215686275,
        "right": 0.49765807962529274,
        "bottom": 0.9681372549019608
      },
      "unionBounds": {
        "left": 0.0234192037470726,
        "top": 0.09068627450980392,
        "right": 0.9625292740046838,
        "bottom": 0.9803921568627451
      },
      "stageScope": "one-shot",
      "scaleToReference": 1.2380952380952381,
      "confidence": "medium",
      "identityContinuity": "owner-provided-sphynx-video",
      "note": "Native f60–116. Forepaws lift f6, all four paws airborne f15, first forepaw support about f20, all paws landed by f30. Source camera/head scale changes remain; use one constant crop/scale. Approximate support centers and skull excluding ears; separate cloud has its own bounds."
    }
  }
});

export const MOTION_POSES = Object.freeze({
  "blink": {
    "start": "sit-front",
    "end": "sit-front",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 96,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "yawn": {
    "start": "sit-front",
    "end": "sit-front",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "listen": {
    "start": "sit-front",
    "end": "sit-front",
    "role": "orient",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "nose-lick": {
    "start": "sit-front",
    "end": "sit-front",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 96,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "pleading": {
    "start": "sit-front-hat",
    "end": "sit-front-hat",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Hat is held throughout; black eyes and anthropomorphic pose. Context-bound, not a neutral idle transition."
  },
  "mouse": {
    "start": "sit-three-quarter-right-mouse",
    "end": "lie-belly-right-mouse",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 192,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Starts seated and ends prone, with the toy mouse. Perspective and head angle vary inside the generated source; no standing/get-up transition is present at the end."
  },
  "lying-toy": {
    "start": "sit-three-quarter-right-mouse",
    "end": "lie-side-right-mouse",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 192,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "feather": {
    "start": "sit-look-up-right-feather",
    "end": "sit-head-down-right-feather",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-1.jpg",
    "note": "Upward profile foreshortens the face; feather excluded from body/ground calibration. Finishes looking down. The generated source moves closer to camera; fixed calibration does not remove its internal perspective change."
  },
  "tail": {
    "start": "sit-front-narrow",
    "end": "sit-front-narrow",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 192,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Narrower frontal skull/torso than blink; visible identity/proportion drift. Avoid automatic hard cut from close frontal expressions."
  },
  "side-hop": {
    "start": "crouch-three-quarter-right",
    "end": "sit-three-quarter-right",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 144,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "paper": {
    "start": "sit-three-quarter-right-paper",
    "end": "lie-belly-right-paper",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Starts seated and ends prone, with the paper ball. The generated source moves closer to camera; fixed calibration does not remove its internal perspective change."
  },
  "yarn": {
    "start": "sit-three-quarter-right-yarn",
    "end": "crouch-right-yarn",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 192,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "groom": {
    "start": "sit-front",
    "end": "sit-front",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 144,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "cursor-button": {
    "start": "sit-three-quarter-right",
    "end": "sit-head-down-right",
    "role": "interact",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "cursor": {
    "start": "sit-three-quarter-right-cursor",
    "end": "sit-head-down-right-cursor",
    "role": "play",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "sniff": {
    "start": "sit-three-quarter-right",
    "end": "sit-three-quarter-right",
    "role": "orient",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-2.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "rub": {
    "start": "stand-right-post",
    "end": "stand-three-quarter-right-post",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Post and base excluded from cat landmarks but must remain visible; prop-bound scene."
  },
  "scratch": {
    "start": "sit-head-up-right-paw-at-ear",
    "end": "sit-head-up-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Starts with hind paw already raised. Upward face angle makes scale less certain."
  },
  "knead": {
    "start": "crouch-front-right-forepaw-raised",
    "end": "crouch-front-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Starts crouched with one forepaw lifted; frontal foreshortening, not a neutral standing start."
  },
  "shake": {
    "start": "sit-three-quarter-right",
    "end": "stand-three-quarter-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "body-groom": {
    "start": "sit-three-quarter-right",
    "end": "sit-front",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 144,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "stretch": {
    "start": "sit-three-quarter-right",
    "end": "stand-three-quarter-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "ledge-reach": {
    "start": "stand-right-platform",
    "end": "stand-three-quarter-right-platform",
    "role": "interact",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Ground is the top of the platform at the cat's paws, not the bottom of the platform."
  },
  "look-back": {
    "start": "stand-back-right",
    "end": "stand-back-right",
    "role": "orient",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 120,
    "evidence": "work/life-cutouts/calibration/last-3.jpg",
    "note": "Rear three-quarter view; head width is an estimate. Body stays facing away; this is not a full-body turn."
  },
  "roll": {
    "start": "lie-side-right",
    "end": "lie-side-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-4.jpg",
    "note": "Small lying reference; head is rotated. Use this fixed physical scale, never fit lying height to standing height."
  },
  "lie-down": {
    "start": "sit-three-quarter-right",
    "end": "lie-side-right-head-up",
    "role": "settle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 168,
    "evidence": "work/life-cutouts/calibration/last-4.jpg",
    "note": "Same pose label is necessary, not sufficient, for a seamless transition; position/props must also match."
  },
  "arched-back": {
    "start": "stand-right-arched",
    "end": "stand-right",
    "role": "interact",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 72,
    "evidence": "work/life-cutouts/calibration/last-4.jpg",
    "note": "Tense alert arch and brief open mouth; retain manual-only behavior."
  },
  "rear-leg-stretch": {
    "start": "stand-right-hindleg-raised",
    "end": "stand-right",
    "role": "idle",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 72,
    "evidence": "work/life-cutouts/calibration/last-4.jpg",
    "note": "Starts with hind leg already raised; not a neutral standing introduction."
  },
  "jump-panther-short": {
    "start": "stand-low-right",
    "end": "stand-low-right",
    "role": "locomotion",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 124,
    "evidence": "work/life-cutouts/calibration/last-4.jpg",
    "note": "More realistic side profile, dark eye and pendant collar differ from frontal Osiris. Manual-only continuity recommendation; one short jump ends in a low stance, no recovery run."
  },
  "walk": {
    "start": "walk-right",
    "end": "walk-right",
    "role": "locomotion",
    "verified": true,
    "firstFrame": 0,
    "lastFrame": 82,
    "evidence": "work/life-cutouts/calibration/legacy-walk.jpg",
    "note": "Both endpoints are walking phases, not a get-up/settle transition. Right-facing body; no turn in this source."
  }
});
