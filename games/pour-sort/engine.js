(function () {
  'use strict';

  const capacity = 4;
  const colors = [
    { name: '柚橙', icon: '●', light: '#ffac58', deep: '#db6234' },
    { name: '梅紫', icon: '◆', light: '#ae95df', deep: '#6d4fae' },
    { name: '薄荷', icon: '✦', light: '#77d9b6', deep: '#21947e' },
    { name: '海蓝', icon: '■', light: '#8cb7fb', deep: '#395ab5' },
    { name: '杏金', icon: '▲', light: '#ffde7b', deep: '#cc8a2f' },
    { name: '莓红', icon: '✿', light: '#f48b9c', deep: '#c34262' },
    { name: '松绿', icon: '✚', light: '#92ba72', deep: '#507542' },
    { name: '藕粉', icon: '♥', light: '#f5bdde', deep: '#a86395' },
    { name: '湖青', icon: '⬟', light: '#8bdde8', deep: '#30849a' },
    { name: '蜜棕', icon: '⬢', light: '#d3aa85', deep: '#835850' },
    { name: '青柠', icon: '⌁', light: '#d1df7d', deep: '#738d33' },
    { name: '霞红', icon: '☀', light: '#fa9479', deep: '#b5333c' },
    { name: '靛青', icon: 'Ⅱ', light: '#8a8dc8', deep: '#303b79' },
    { name: '琥珀', icon: '◐', light: '#ffcb63', deep: '#94611c' },
    { name: '云灰', icon: '≋', light: '#d6e2ea', deep: '#70929f' },
    { name: '米白', icon: '☾', light: '#fff2bc', deep: '#c6b590' },
    { name: '樱粉', icon: '⊹', light: '#ffacdf', deep: '#b94389' },
    { name: '芽绿', icon: '△', light: '#b2eb7a', deep: '#548b39' },
    { name: '烟紫', icon: '◇', light: '#cbb6cf', deep: '#846e9f' },
    { name: '茶绿', icon: '⚑', light: '#b8bb7b', deep: '#52613a' },
    { name: '汀蓝', icon: '◒', light: '#69c8ff', deep: '#246f9e' },
    { name: '乌梅', icon: '×', light: '#a98ac0', deep: '#553655' },
  ];

  const layouts = [
    ['初次分杯', false, [[0, 0, 1, 1], [1, 1, 0, 0]]],
    ['三色试饮', false, [[1, 2, 1, 2], [1, 0, 0, 2], [0, 0, 1, 2]]],
    ['玻璃架', false, [[2, 1, 1, 0], [0, 2, 1, 0], [2, 1, 2, 3], [0, 3, 3, 3]]],
    ['雾里青梅', true, [[2, 1, 3, 0], [2, 0, 3, 0], [1, 0, 1, 1], [3, 3, 2, 2]]],
    ['一瓶藏一味', true, [[4, 0, 2, 3], [0, 4, 3, 0], [2, 4, 2, 2], [0, 1, 3, 1], [1, 1, 4, 3]]],
    ['见底才知', true, [[2, 5, 3, 4], [3, 0, 0, 1], [0, 4, 0, 3], [1, 5, 5, 1], [2, 1, 5, 4], [3, 2, 2, 4]]],
    ['晚风调饮', true, [[3, 1, 6, 6], [0, 2, 6, 4], [5, 5, 6, 3], [2, 0, 3, 2], [2, 5, 5, 0], [1, 4, 3, 1], [4, 0, 1, 4]]],
    ['夜色满柜', true, [[7, 6, 2, 7], [0, 1, 0, 0], [4, 5, 1, 1], [1, 5, 3, 6], [0, 5, 3, 6], [7, 5, 6, 2], [3, 4, 3, 7], [4, 2, 4, 2]]],
  ];
  const original = layouts.map(([name, fog, fullBottles]) => ({
    name, fog, bottles: [...fullBottles, [], []], capacity, goals: {},
  }));

  function parseLevel([name, rows, recipe = ''], fog) {
    const bottles = rows.split(' ').map(row => Array.from(row, color => parseInt(color, 36)));
    const goals = {};
    if (recipe) {
      recipe.split(' ').forEach(([index, color]) => { goals[parseInt(index, 36)] = parseInt(color, 36); });
    }
    return { name, fog, bottles: [...bottles, [], []], capacity, goals };
  }

  // Each four-character group lists a bottle from bottom to top. A recipe
  // marker (such as 'a5') identifies the required bottle and its color.
  const campaign = {
    classic: [
      ['初见果香', '1100 1100'],
      ['三味上桌', '1022 0020 2111'],
      ['清晨试饮', '1200 0122 0121'],
      ['窗边四味', '0111 0332 2213 2030'],
      ['架上果瓶', '2102 3300 2031 3121'],
      ['倒成一排', '2233 1130 0221 3001'],
      ['五色小站', '3301 3011 4014 2034 2224'],
      ['瓶口交错', '2304 3112 4120 1304 3042'],
      ['果香小巷', '1124 1304 0040 2342 2313'],
      ['青瓷一柜', '1431 0301 2243 2324 4001'],
      ['午后的六味', '4150 0205 3215 0432 5231 4134'],
      ['暖阳玻璃', '4053 3451 5202 2040 1353 1421'],
      ['循色摆瓶', '2012 3030 4524 5532 4015 1413'],
      ['柜台换班', '2343 0610 5652 4315 3026 2451 4160'],
      ['七色果园', '0316 0265 0313 2454 4025 5631 1264'],
      ['玻璃小径', '1525 6451 2514 0204 3036 1663 0432'],
      ['饮品方阵', '6352 3104 3250 1246 0236 0416 5451'],
      ['八色长桌', '4753 2057 2012 3450 1567 4126 6140 3673'],
      ['谷雨拼色', '2370 0536 7542 6704 2467 6341 1510 5132'],
      ['杯边等候', '2305 3153 2326 1760 0747 6517 2405 4146'],
      ['转角甜香', '4713 2536 5106 7405 2465 3071 7214 0236'],
      ['九色仓房', '0876 3454 3401 0673 8528 7518 1602 2375 6142'],
      ['一柜日光', '2526 5875 8721 4318 4013 0307 6356 8441 6072'],
      ['果汁午市', '4172 4824 0487 0821 1350 0653 3586 6237 1576'],
      ['十味全开', '6386 7820 2629 5740 4183 9349 7102 5451 7106 8935'],
      ['玻璃回廊', '6803 7618 9231 9217 4505 5306 7492 6103 4542 7898'],
      ['桌上彩虹', '6709 0698 7634 7345 2819 4031 2475 8610 9385 2152'],
      ['十一味集市', '68a7 6994 a673 5a10 8127 5206 5904 4428 3a01 9712 5383'],
      ['清透深处', '4743 252a 1501 7398 7839 060a 3462 91a6 6815 8972 540a'],
      ['满柜果香', 'ba70 337b 446a 2398 a469 2308 495a 085b 60b7 5171 6152 2918'],
    ],
    mystery: [
      ['雾中来客', '1741 0356 0432 7613 1627 2702 5306 4554'],
      ['隔瓶听雨', '4267 2647 0143 1563 0725 1450 3270 3156'],
      ['暗色杯沿', '0171 3742 3174 2663 4561 2567 5030 4250'],
      ['看见第一层', '6033 4022 5210 6761 5551 0213 4774 6437'],
      ['晨雾长架', '7172 5762 2530 5446 0533 1410 0312 7466'],
      ['云下八味', '5343 7112 7732 1650 6446 2100 0742 3655'],
      ['窗雾成纹', '1437 2401 6312 2400 6407 6726 5355 7351'],
      ['九瓶藏味', '0357 0685 3246 4318 2177 6041 2650 7428 5381'],
      ['颜色不说话', '6555 0466 3781 8275 1840 2321 0164 3307 4827'],
      ['试味之间', '1088 1528 2376 8070 6734 3416 2623 4551 7540'],
      ['雾后玻璃', '5423 2572 1615 6508 3766 4320 7884 1341 0708'],
      ['瓶中线索', '8404 5575 6421 2637 4082 8206 1713 5731 0638'],
      ['傍晚九味', '7243 8660 1373 3078 5482 0154 1726 4801 5625'],
      ['十色藏一柜', '3981 2509 7510 8794 0491 3560 4372 4662 8358 6721'],
      ['倒影相叠', '7805 9909 0736 4162 7173 4183 1282 5255 4698 4306'],
      ['雾色斑驳', '8715 1837 8120 7123 9365 8043 4629 6995 5074 4602'],
      ['十一味上桌', '30a4 978a 2a63 866a 5959 2193 7167 0421 1035 2470 8548'],
      ['巷口夜雾', '5774 23a8 0661 a981 7744 0325 6492 5158 a233 a019 9806'],
      ['深柜的秘密', '0467 9882 3584 6155 0027 2930 9a71 6243 4aa1 98a6 5317'],
      ['灯下十二色', 'b7bb 0670 0265 45b3 8a97 1a32 4956 86a1 9489 51a7 3123 2084'],
      ['雾散前一刻', '1718 2046 9873 5b45 3181 b567 4023 a0a9 625a b387 029b a469'],
      ['辨尽瓶底', '484b b957 7195 122b 5132 8584 4013 2669 83a3 7a76 0a69 b00a'],
    ],
    recipe: [
      ['第一张签', '0001 1110', '00'],
      ['三味订单', '2101 2102 0012', '12'],
      ['三味交接', '2211 1012 0020', '11'],
      ['四味装瓶', '1120 3200 0311 2323', '32'],
      ['标签朝前', '0332 1020 1103 2123', '32'],
      ['换一只瓶', '1021 0212 2033 0331', '22'],
      ['一签五味', '0103 1240 3234 1402 1423', '41'],
      ['两签见面', '1042 4402 0241 3102 3331', '01 33'],
      ['双签对照', '4342 0320 3310 4121 0412', '10 23'],
      ['五果送达', '1431 0233 4320 1224 0401', '24 40'],
      ['等待交杯', '0234 5253 0130 5212 4404 3151', '21 53'],
      ['签贴两边', '4301 3512 5032 5230 4415 0124', '35 50'],
      ['顺着标签', '4555 0432 2133 2104 4131 2500', '11 52'],
      ['七味清单', '4342 5206 1023 6515 1135 4660 3024', '00 21'],
      ['瓶口签名', '2354 2265 6106 3140 5036 1125 4403', '26 51'],
      ['记住位置', '6314 6122 5313 0042 5261 0445 0635', '44 60'],
      ['七色出单', '1154 3060 3546 5115 6242 6330 4220', '23 46'],
      ['八味排签', '7763 6225 4364 0211 0500 5467 4521 1733', '07 71'],
      ['三签新客', '1124 0314 1527 5076 3665 3364 7040 2275', '10 43 67'],
      ['三签交错', '1402 3623 6675 0456 1335 7104 2770 1245', '01 30 57'],
      ['八色配好', '2056 2201 6133 7401 5567 0741 5644 3372', '14 37 50'],
      ['签上有约', '1066 0578 3243 8184 3674 2540 8265 2315 0771', '43 67 80'],
      ['九味分配', '5287 8653 7382 4600 6062 5345 1028 4134 7711', '46 50 74'],
      ['标签不乱', '4878 7551 8606 3712 0124 3516 8300 2246 5347', '17 33 85'],
      ['十味配方', '9614 9844 3943 1023 0850 6101 9758 5235 2627 8776', '17 69 98'],
      ['四签登场', '4692 9582 3370 0882 5446 1937 1270 0156 8731 9465', '23 37 61 88'],
      ['四签分桌', '5446 9291 3527 8816 4057 8743 1098 0032 5173 2669', '19 61 70 85'],
      ['十一味上架', 'a812 6a04 9343 7098 2424 7175 52a6 3396 7680 5901 5a18', '16 57 9a a5'],
      ['临窗四签', '5a03 2257 9770 29aa 6894 0510 1383 6914 6a34 8165 4278', '2a 61 86 98'],
      ['满架配方', '1841 708b 659b 3344 9905 3576 326a 0aab 27ba 6745 9028 8112', '44 57 63 96'],
    ],
  };

  // Dense campaign for levels 31–100. Each board is a distinct, connected
  // layout with a verified solution using the two original buffer bottles.
  const denseBoards = {
    classic: [
      "cd11 8357 9da7 bba8 9d61 b950 a445 53c2 0601 9637 c76b 2d48 2248 ac03",
      "7b45 d7a4 46b3 9c82 621c d7b3 7190 3950 184b da30 5cc8 1256 682a 09da",
      "1123 bc07 3380 2c06 d501 4846 7bab 8d96 aa98 1534 b5ad c97c 6597 42d2",
      "7384 94bc 076c c1ad 9c10 d714 b235 5305 d569 ab2a 8a96 d284 710b 2368",
      "4153 7016 6ac1 72b8 4b0d 701c 2dbd c782 a653 985b a684 943c 05a3 9d92",
      "32b4 c44c 9c56 3731 2ba8 0b25 0863 679c 6d92 d1d4 8017 bd1a aa87 5095",
      "4278 7397 ab60 2510 15a6 8ad7 5bbb dc2c 5ca1 0434 8d60 9123 9cd8 3694",
      "68b4 a5a2 5a72 26dd 40c5 1cb9 19cd b703 84a8 97d3 9b7c 8036 1460 5123",
      "d68b 9b95 5ae4 d00a a46c 8db9 3759 17c5 1c64 a0d0 3b81 8133 2e22 e77e c642",
      "2d8b 2a61 241e 903e 1c58 687d 376a bbc0 95e1 55c7 c4db e800 679d 439a 243a",
      "8de1 7a48 40d9 07a7 8948 e6ce 2653 c03e a642 9cbd 107c 59ab 3252 1365 d1bb",
      "cab1 7d93 7005 04ed 4e8b d59b c3a2 6de6 170c 6a69 8415 2794 1cba 822e 8533",
      "e42a d0cc db6a 9d26 6c51 32e7 b038 8021 c868 e5e3 4741 0b95 a591 7b93 a47d",
      "65c9 9bd1 a37e e86a 42c2 e445 236c b91e d683 cd90 b30b 75a8 8477 a1d1 5200",
      "5d2e 5c1b 48ad e22c e4de bab1 68b3 c0a9 2675 4178 978a 4003 6936 7d50 93c1",
      "3587 4b7d 0d44 62b8 8296 6a25 35e2 677e 185e c313 d4cc b1b0 da99 9eaa 001c",
      "8967 76ac 42fe fb0c 1e3a 30f4 156d 265e 88f3 75ae 49b0 1d9b cb21 34c7 5d2d a890",
      "f70b a19e d9a3 9612 3fe4 4bb7 c646 2807 5eac d5c0 0537 182f 14fd 885c ea9b 23d6",
      "5890 8364 fd26 e7c5 dd8e 30a3 6e1a acc0 7d4f 2589 3974 1179 a6cb 12b2 4b05 efbf",
      "e909 35e4 7466 edfc 7056 b8c1 bd71 9b03 cc62 b9ed aa1d 85af 1f34 48fa 2578 3022",
      "0b3a b402 7e2f 9ac5 9b97 fd40 23e2 1f4e 3a04 c557 8615 818d dbf9 3cc1 86de 6a67",
      "1a21 6a1b 00f9 9369 ce87 84d8 200f eb7f 5cbb f295 2343 8c37 cd4e 76d6 4a1d e5a5",
      "625b 007a 9c2b ea63 9ef7 241f fb61 8b75 3414 35e9 c9dc 8604 1a2d ac7e 85d0 f8d3",
      "b387 28de 9fa1 63f1 09c4 540a ed96 d226 5954 70e8 f73b 2ccd ec15 aa8b 674f 30b1",
      "bea5 f2f0 6483 8082 3a9e 6d56 7agb 20ed g5c0 cf12 gg59 4671 1a4c 8cbe 3d73 9419 7fdb",
      "96cc 4e63 a7dg 4b68 0de0 82g9 51b3 0d4b c4fg f57a df01 2927 f635 e5b2 8981 acea 37g1",
      "6722 da7f f79b ga90 48da gc54 05fe 12c0 1436 gd3b 11be e3a5 de97 945b 863c cf08 g682",
      "d21b bf38 fa7b cgag c175 89c4 84c2 9fg5 6610 4358 ag0d 164a 2900 7d3f 5e6b 3d7e 9ee2",
      "2fb5 5123 d4ga 6eed 8827 56g8 b0gc 5bfa c19d 2709 0f06 ga6a 48c3 941e ef39 3174 7bdc",
      "9d8e 5768 gf1d 13e9 3968 4f32 gc1a 454g ccg0 ae4f a829 0b76 2573 b0df b572 e0ca b6d1",
      "5gd2 58ad d9g1 b524 ga37 3c9b fb0f af25 6086 eba1 fdc2 c048 7698 16cg e793 3e74 0e41",
      "870b b33a 24c6 eda4 8217 6bg0 8ce7 c95g c55a f6d6 943b g49f 1212 gf7e 0dd0 f83e 1a95",
      "98a3 01e5 25fb ghba gd4d 62e4 72ge 85a2 68a5 6h79 8471 c3g0 hb16 f3hd c910 cb90 ef7c fd43",
      "de9d 3c56 803c f6bf fb49 0cb7 h016 4b6c 35gg 4h8f 1a53 24d7 g7ge 2a81 eah5 819a 2dh7 90e2",
      "7dh7 712f 60dc 8c55 6798 63g5 gc4d f14b 049e 29e3 h8h0 6ec8 eh29 fb4b gada 1a3f ag02 b351",
      "213a 168d ade1 5052 bh7h 8gc0 f82g 87e7 4bae b3d4 fce3 3a6c g796 h5g9 chb4 914f 5df0 9026",
      "05a7 heg6 h71h b89d ce04 de63 3fbg 5229 43gf 4bdc 9f3g 880d 6c49 f071 e2a1 b126 575c aha8",
      "947d hf6a 1148 c16c d4e1 3b89 gc8e gh5e 370a b8g0 0dab h4bd 9c7f 2fa0 5265 5h3g f97e 3226",
      "82g7 0gdb h923 2574 f469 aegc g072 c601 3f6b ff1c 805b 73d6 89db 9h5h 14a8 e1d4 5ae3 aceh",
      "beef 1087 e9cc 6bhh a24d 3793 4bbg 8782 ha5h 1ig6 4dc5 6017 23g1 9865 0i4f a20f da5d gief ic39",
      "aa9g i64e dd8c 542b h54i 172g egi1 fa80 a00e 763c 11ib 9fd3 e69d 0528 h9gh b7ch 357c fb86 f243",
      "3219 bdc2 5a4g a35h 84g8 fdbi 47h5 7gde 2ie6 0041 a3a7 8661 9h3g 5bcb 98he 6f9e 72ii 00fd ccf1",
      "f3ig e94g 910h 7i07 5634 bcd8 e18i hh5b 85d2 8bff a1df deh4 0c2g 6g9b c391 aa22 7a04 c36i 7e65",
      "7162 cc05 ahdh 65fb g141 ci8c 6319 2ig2 fhg4 74b5 2b9e b53e 88ih a0ff 0g7a 3d9e 6a34 0d8i 7d9e",
      "2847 gb5a 6177 4c1h 41ib dbg8 93ch 4ei6 1085 9h9e a8fi 3c2g cf00 3gdh d5fi 0b53 a6a7 6d2f e9e2",
      "2cb9 9if2 3h0g 6if8 eca1 1abi 4550 1eeg 77bh gd4d c2h3 0b27 458g 7a5f f9c1 6486 3da0 i69e d3h8",
      "345d 7bab 7ig5 2h7h 28ee 10e3 239a dc9f 2fhi 9ib8 4dcf 8135 0660 9ea1 g454 di86 bafh 6g1c cg07",
      "b4dj 68d2 5bfe 156j i2bc 4a53 7dc7 0g32 j3c9 h898 6aa1 fei0 891g 9be2 c007 6d3h f7ga i4e5 fig4 j1hh",
      "2chc 88a9 hadf 73g9 03hi 038e 6404 iefj j8ia bf45 cb1b id56 91dj ge37 22f0 179c 54je 5h2d 7gb6 a16g",
      "16f8 a81h 6j92 5iic a4cd bhbd 03eh gfg7 2c84 j3bg 8d75 d9a0 b7e2 093e a70i jfe9 45ji g1fh c314 2656",
      "729j ajf3 b866 59ch 50g9 ii84 6j1d jfi4 7bde aefe agh9 e8cd gh1c 045b 2870 17h3 6i2f 03db 3c2a 415g",
      "30f8 6ja1 89ed c1g0 gii8 330f d5a4 aabe hdjf igej d652 4772 fe9b cc11 9b85 bh2c 6i4j 6497 723g h5h0",
      "67h4 4ah9 d76h fc72 b9ie g05a gc8j 82c1 1fjf 6ed0 07dh 35gb j4e4 65a1 i1ic 533i bdbj 29g8 2e8a 3f09",
      "g98j e2de fbb0 bf14 7543 a312 h3ec 0388 c4ia b7jd 6hij f9da 9hca fi7g 5012 jg6g 5ci0 46d2 e876 h519",
      "1003 0g4e 3bdd h3hh 89j8 5ijj 66f9 ec9a 6h5c g5dc e6ia fib4 2dg1 9j8i 77ab 3f1a 27c8 2ge1 2447 fb05",
      "jje4 0867 9bfa 8jdb 17b8 00k8 4i15 h4gf ji2a 9fbc 6ech 3gk3 h16i 90hf d72k e2ad igc4 3e92 d7c5 5gk1 a356",
      "225a bk90 igja 2c7d h76f 60b4 ji68 b437 10c7 3924 3dh9 a9eb fckg cdk1 e58f 4khf g1h5 a01g i8i8 6de5 ejj3",
      "0fbi 6hai aj35 8ckc 7i11 f06e j790 b4gg 4e35 a6fe gc7k 5169 2k2k 4398 3cjd b80b 8a51 9e4i 7fhh dddh 2j2g",
      "658a icj8 kc6k hck2 441g i9f3 eje2 ab75 71f4 gb3d 6i3f e21d 5d10 j89b ckd9 a20e 74g6 0f9b 07ag hi38 hhj5",
      "c82e 11cc e76j gg95 fb63 khdd 03fg 247j 4032 bdjk hc7j 0428 a8e6 ih4b f58g adaa b9e0 iikh 796k 3551 1fi9",
      "5acf 08ff 7f0e 2c5h d6ak 84ib 4c3k 78ig 3hb9 4g72 d3gi jh0a 5kbd 1839 69c1 79k1 abij dgj5 42je 2e0e h661",
      "7551 aj6c 989d abb6 0bcf 2f2e 1fdg 7460 gahj 55ig ie8a cf04 h9hb 0kj9 71k8 d64i 2c8j h33d 2gee 1ikk 3437",
      "fgj2 b0h2 g858 3ig1 ej5c d7dk 7721 4i83 fadb cji2 6ck8 65he 3c44 k1i0 efh1 6b0a 7g6b 9a0k ef99 3a4j h59d",
      "c2gb k28j ebh0 gd15 kcb7 28j4 a5c7 jd05 4hch 9kd0 6920 f3a8 3d16 elf1 5abl 4he9 l716 igif i74e al63 jigf 839k",
      "182l 2d28 1ic5 04a3 hef3 c0bj 7hb1 8dgi h9ae g937 80jl 61j2 ff49 56e7 iabd k56l 3bfc gack g0le 56i7 4khj dk49",
      "60ih 0cff gi1k 4l3d 21h0 5bld agej cc3g 11j8 527b 35dk h88i l72j b27i 9k6f 9af7 bead 436c 60ke g9l9 he5a 8j44",
      "i01l 7323 6h07 cggl ci7k lgjd e615 f7fa hl95 a80i 6j54 4b99 5ajd 23eh 28ka 28h8 1cb4 0g9c 6ef4 db1j kb3k idef",
      "g0f2 i4i2 415e 5ehd cd65 3ejg dckl 67jb 6hf8 48ah 995d 0e73 f9aa 97bk lkji i614 k223 f38g alcc 0017 jbhg 8bl1",
      "791f k612 26i6 d7b1 la0h h5ac b805 5135 h4je g9gc 39lg fih7 lb48 gdkj 24ak keie 27ci dfl8 d9j3 4jac 08f6 30be",
      "3c06 2866 68i9 heb2 d5cj bi1i 7941 4l3e al8f g419 85aa ecfd 372h ak4d fj05 g50h l3h2 bkfe 9k1j blck id7j 0gg7",
    ],
    mystery: [
      "952a c425 aa41 33c7 c16b 0d78 0b2c 5743 bd0b 86d6 a839 1019 d964 7285",
      "4ca2 8d1c 8dbd 3412 03a4 19ba 715b c009 572c 9d9b 3572 76a6 6305 8486",
      "7392 b4d4 8da5 7285 5073 4607 aa38 d922 9c6b ad01 6b8b 0549 cc11 6c13",
      "b4d3 029b 7a42 5d6c c6c9 5904 6007 1c25 8889 a533 81db a142 1b73 7da6",
      "0529 a533 07cd cba3 81c8 703a b058 bb19 6d79 9ad6 5412 4272 6d6c 1844",
      "c726 3146 b5d5 8ba0 a96b 0cc9 8962 cd31 2318 0103 8579 b274 574d daa4",
      "7898 2b55 9d6a 60c4 d058 1a82 931c 4a37 019b 6b45 dcbd 6734 c271 30a2",
      "d0bd 1b4c 3bb8 3876 5505 2ac1 4272 6a96 7948 48cd 039a 961c 5a32 170d",
      "bd42 0d44 6d6b 6c53 3032 13ad a8e0 e78b 2c75 e715 b0ac 6999 c512 8718 9a4e",
      "d703 1a94 5248 8c2e 6973 0bc6 0547 4339 0e1d 28ac 1c65 e71d d8e2 ab65 9bba",
      "3eb6 86e6 72ab 8c5e 90c3 3ed7 a042 d77a 0086 ba14 c99c 4312 b892 1dd5 5154",
      "3318 a617 d046 ce8a 7618 b92c 2ca9 bb48 47dd 7ea5 0d03 e292 90be 6c55 5431",
      "ca6d db96 8c48 e220 4415 47cd 8169 7a79 b09b 175b 208d 5a12 3a5e 63ee 3c03",
      "e21a 5241 77ba 8551 6993 abad c381 994e 60eb 2267 c037 604c d3e5 c04b 8dd8",
      "987b 8195 7c53 ddea 08bb 9706 3ecd 6c49 6b1e 4ad5 4222 2370 38e4 5061 caa1",
      "d6b9 d7ac 1488 5231 81eb ec50 43b3 270b 7567 812e 26ae cd9a a049 3dc4 0956",
      "0248 f3b5 76c7 c5dd 0149 ddc8 85e0 3721 a15b b761 fea6 fe8c 623f e392 a494 9ab0",
      "343d e423 152b 9b25 fb0c 9578 1069 6ad2 18fa c606 e4e4 cfcb ad80 fe7d a737 8915",
      "994e 047e ca54 0b3f 2953 3bc2 daf8 add0 066a 28e9 5f71 14ec 1f28 c3b7 6518 b6d7",
      "d7b8 ae72 42f8 0303 9f3f bdd5 c3a1 b7b5 29ca c512 1c86 6d45 fe40 a176 0948 96ee",
      "91d7 58a9 3561 0a9c 64df 2ba8 b2c3 4647 0d30 9e5e 7a5b d1f8 efb7 6304 ec82 cf21",
      "2fd7 1058 6e36 c081 23ed 31fa 52cc aca0 e6b7 8f64 5442 ba0e 471d 799d 8b53 fb99",
      "1f09 ae7e 581f df14 d29e b640 6c42 cb78 712b 0088 ced9 b539 73a6 a6ca 25f4 35d3",
      "869b f7cb c1b0 c02f 62ae dc31 ed27 5d67 44a5 23e0 0816 d78b 4ea8 9f55 a9f3 3491",
      "gbe0 22f4 0935 655d 37f2 4381 e7ag 8e9f 1ac7 a2e6 71bd b840 891d bdfc g5c3 466a 90gc",
      "g01d 9a8f e82e 0ae9 6bb4 1gc8 57a2 f347 186a c57d 7f09 g5cf 160d 69d4 ebc3 2245 3b3g",
      "0a20 52g5 ec8g bg90 2337 ce7f 4418 f6a1 cd67 f949 3f59 5d2e 866a 7cd8 e1gb ad1b 430b",
      "fe21 3b06 82b1 697a 5643 g3fd a77b c8d2 09gf 3181 dg75 a06d aee2 b48g c90e f5c9 445c",
      "fe99 542a 3c3d 71g3 d805 6581 7c88 9a09 42da bdba 2b40 c75e g6fe f370 g1c2 f1bg 66e4",
      "4821 e3g6 5923 90c4 b57e a48b 0d75 d7e9 67ga c1b8 395a 1c12 gdf0 64cb e608 ffgf 32ad",
      "f10b 0779 56e1 2c87 8c2d 08fe f25b a434 ga5b dg43 469e 7398 9dg1 3cd0 ebcg 25af 616a",
      "dc7g 9ec6 db8b 2dee 4abf 28a1 g54b 9f4e 8673 c012 016a f255 g439 1c90 63gd a50f 8377",
      "h305 3200 eh5d efb5 68b0 92g9 73ch 6ab5 g1a8 7d44 6dfe gh41 4cf9 8791 f26b agdc c81e 7a23",
      "6d52 2a7a 41f5 18b7 eh9h 498f g35e e6eb f1gc bb69 8771 3cgd 9030 0a8a 6hc4 c32d h405 fgd2",
      "2e9a 3c85 4210 98ba 00ab 6dhb 982f f9gc g354 e686 7307 f4ga 12fc gcdd 5he3 657h d74b he11",
      "6ae0 dfg0 2e56 a876 g3ec 78hd be40 451f f4b2 822g 7gd8 4ha3 hh35 3170 91cf da19 cc9b 569b",
      "86d5 a9ah 4c47 35ec 3639 g0f0 b81c 1geg 82bc ef8a 707d baf2 db26 794d e0g6 1495 f2h3 h15h",
      "759g 6324 7e69 8hdf 0acf 194b db17 b4eg 2cg6 ea5h 7fd3 1b35 460a h9f8 38cg 1c52 82ah 0d0e",
      "a147 88gc 496e 1fd8 758b 03fg bc57 23e4 f2b3 eg6h g902 e279 faac 950c 3dhh d616 415a 0hdb",
      "58f7 i155 0ec4 74ai bd98 3dg1 1he3 68a7 egfc b142 8ge2 g5ih afd9 i6c2 2h97 3309 0a6c d06b fbh4",
      "679h hai2 f9b1 db40 558h 043i adb1 d5hc e26e c21c 44ge g3gg 7569 d01c f3aa 98f7 60ib 8837 ie2f",
      "hg65 eb7i 9f18 cc16 c16a hd4g b6dg h957 a028 248c 4df3 803f 9ieb heg1 3325 2d09 45i7 aa0b fi7e",
      "8ib2 736h 29ai e31h cc5g hbf4 4ied 4522 i86f gefg da9b 55d8 a001 cg76 0d0c ah41 6f33 9e81 797b",
      "b4g6 fc12 e673 92e1 5h0e 4c80 db1a 47ab 8a17 c2c5 hd68 6g9i e73g iif9 20f8 ahif 5d3g 03dh 94b5",
      "314e 5f15 986d 79h6 a6e8 h0f2 g23e 4f0a 6ai7 h504 ie9f 23b3 0dgb gcic dc7i bca1 8hg1 bd89 4257",
      "4eba 9007 ah4g id00 6cg8 49c2 fe3b 1h7a d354 8i55 1f62 3bgf 1b76 27hi eid9 5c3d 8h89 1gae f26c",
      "02d5 ig04 8dhb 2db9 972c e3c4 gi6c cfid 3b65 7588 79ag 260h 5114 7314 f9g0 eahb 3a8a fh16 iefe",
      "7h79 3gi0 6505 j8a7 2f1d f1bi 33df ehb5 616j 2c0h 9gea 8jeb 7iag g6dh e8b9 cd20 a941 3c24 f4i4 5c8j",
      "4bd8 15h3 g4c6 9cib 9116 76af fhah j8j4 6859 b02j eh7b 09ia d30j 8e4a g12d icc7 37eg fi50 23e2 dgf5",
      "1ef2 i1b6 j54e dj8b g24g f83h 8966 hh7g i3e0 e5d3 161f 8b29 i3a4 jaai 0agj 90dc 7c7b 72f9 ch40 cd55",
      "e2j8 j732 c78h hgb7 hc1g 42cd g5ic e648 895i a419 6a0b 1006 7ab5 93hd 29ie df6i j345 ffe1 bj0g 3fda",
      "b0cj 86j2 i9b7 9f15 a6c7 6d83 5231 7hgb 34ei fhih d6g0 g44a 4d1a 22e8 c85h bicf 905j 3def e1aj 79g0",
      "73d1 676e hijh 48af 10bj ge57 6ga0 ef3f h0dj cb45 iaaf 43gb 9b92 6499 8e28 dd5c c810 21ih j27g 3ic5",
      "i3jc 15f8 98ag 0ed6 0aje 7ai0 1cfh 9f4f djhi 7a2c b894 h80g 2713 3dbc jg64 6951 3e54 256g bhe7 di2b",
      "2300 j447 e1d1 82jc cij6 29h3 9a6h f48e b42c b95g h8j7 d705 93f1 f87g iifg 65db c6ea abe1 ah3i 5gd0",
      "ji1j 5gik db7c ebef h3c0 3e98 1202 j4ha 015a d70k 8fc9 3468 e2jf gai9 71ha f5k9 8g63 d4g5 2b6b 67c4 hidk",
      "hkg4 06ce 93df bfdi 891d g7k8 22h3 k354 hbb0 247f i63j 05eg 2c6i 5jb1 g78c de5c 1aji e109 hk74 j9aa a86f",
      "aj13 b451 14a2 ckj9 dhbe 756b f153 538k 9ef3 e78i 40gc i6jg ik22 efb9 digg 8k00 c786 h42f a0hj 7ach dd96",
      "a543 7j08 81dc a8b3 bf14 k92g 2e3f e879 9645 g0c9 2gk6 5j7i 6j5b bhii ccak df10 e2gi 0d7h 4kj1 hefh 6d3a",
      "ic71 aia9 74k7 9b0f ce0g 5h8j hkj6 bjih f03b fa41 befg h364 9141 a56d c3dk g8c3 2d0j 5g22 8e57 i962 dk8e",
      "7bik bc2a 0j91 c6a3 gbd1 570d e839 96kf 0e59 ijfa 8250 21hi 4ca4 k6kg 7fhf 7g2e ghjh c584 3d1j i48d 3b6e",
      "3d9f 7b7a f7he 8c6i dec1 kf3g 0k4g chd4 5k2b 90ic 8fie i6jg 6d4a 98e2 1h0h 80b3 5a4g 1jk5 2a16 95j7 j2b3",
      "8h06 ck5f 098e 10fi 2j38 d97d 76bh 6a2j 1egc hkca 2kg4 bid2 4h6e bafj f97g g53i j49d c031 5i3k 54b7 1e8a",
      "fgil e8ec ea1l kh98 609j i3h7 cdhc 1464 775l 84k2 3502 f5di 51l2 b13a kchf 378a b0aj 4db6 96fg jgj0 9k2i bgde",
      "e38k 75a4 e1d2 9bd3 4i25 0lbh 290a 8llg 9465 cf64 hd80 8c97 63ga h7bi i2fg 3cl1 b1ej 0kkg 5hkj 7fcj djfe a1i6",
      "37b8 b6aa 1a94 hde4 03c0 2g44 50cf ai3h gd71 k205 ki72 l2jd 157i lljk gb8e bf9f hkde 6j6i j91l 958h 8g3c f6ec",
      "bk26 bc4j ae78 l3d4 jgd8 f278 jkaf 695h 5e3l gd9b 42gk d0ia 0if1 6189 l0ce c20h a7h3 hic3 5kjf lg4i 5b61 197e",
      "5bc5 e99a fjk1 e60k 5l8d 47hf g35i j0g9 ala1 hbf4 g2k2 c3c7 4ai8 06h3 e67j 3d11 28il l67d 0jkg h9bf d8bc 24ie",
      "bf98 4i06 hd4d 4lac l061 7jc2 g2e8 if8k j8k9 13ja 79b5 43g0 aef1 6f51 d6ag clc7 id72 5khg i23b 0ek5 bhhl je39",
      "f8dh 6g95 6k47 55lk kf4f 2f6j 9cbi ii4a b8ce 9li1 d20b abhd 8292 3d0g c45j 7eg1 6a0e kj0l c813 773j 3ahg 1elh",
    ],
    recipe: [
      ["51a8 154b 8752 c67d 96ba 2643 3a6a 0982 4dc7 0b75 c9bd 40d1 0c23 1389","49 63 8b a7"],
      ["c293 d5d5 a62a 6753 1941 2409 8b96 ab0d 1788 63c4 54c7 1302 db07 8cab","23 30 84 cd"],
      ["4302 9766 7a26 8190 c535 1835 bd3a 0d4b 4a4d b726 d2cc 9b11 805a c789","35 6a 9b b9"],
      ["9734 8601 5d8d bddc 476b 2294 7b64 1c69 5035 aa22 3a95 a801 c173 cb08","0b 30 a3 dc"],
      ["51a3 28d6 7371 b898 bc35 cb23 941a 946d d6d5 0258 ac07 c2a6 09b4 4107","46 bc c4 d8"],
      ["0164 4c9c 89bb d9d8 50a9 2b06 243d 1367 a7b2 3115 258a 8047 56cc 37da","14 28 71 db"],
      ["4ac4 bc40 1298 05b1 29a3 cb23 d35c 3d72 54dd 0656 6880 b867 9a91 a717","07 5c bb c9"],
      ["db59 74ad 42a7 830d c06a 68d5 b132 b7c6 c416 2895 931a 0458 10b3 29c7","38 56 91 d2"],
      ["1149 314a ab13 8ee8 2ddd 7056 396b 2dc0 ccb7 007a 3e65 5465 7b84 9c29 8ae2","38 44 8c 90"],
      ["0b31 bce0 e6de 0d35 9523 8a24 25c1 647a 41c9 59cb aa67 4d87 8e67 2d01 389b","2e 49 58 95"],
      ["854d cd67 2980 dec8 a1ec 38e0 74bd c664 761e a320 5233 b4b7 9910 b51a 952a","22 44 75 bb"],
      ["d364 69b7 3875 7b21 ce9c 98ae d146 28c4 25ce 0967 adb0 d350 1aab e384 5102","16 aa bd c1"],
      ["2898 ac66 c4ba b9a1 5334 823d 7103 bd00 ecb7 0e76 1129 4d25 5c8e e697 4d5a","45 7b 8e e4"],
      ["0ec6 604b 7945 5c12 5d63 ec78 11de 8230 9b60 bdda 727e 51c3 8494 83a2 b9aa","00 5e 72 ac"],
      ["0340 5d17 492a 4552 7ec8 0a19 88d1 935d a6be 42bb c908 d7b3 a1c7 63e6 c2e6","3e 94 ca e2"],
      ["914c d187 45a4 5da2 330a 04d2 e6a2 071e b998 e376 c5c9 8bc5 3867 1db6 e0b2","09 51 b8 ee"],
      ["2c4a 99a5 c75c 375f 8d01 0640 7fd8 9e38 6c3d 47f3 9bae 05a4 bbe1 be21 21fd 6826","1e 48 67 b0"],
      ["8c18 e12a 3090 ced4 d845 2c20 7e97 66bb 60a9 af1f fbd6 97cf 3d1e 284b 74a5 3535","05 1f 3c e7"],
      ["e42c ad77 9f66 810b 5a21 394f e38e 2b52 03f9 086d ba4b 47c6 0a15 1835 cf9d ced7","1a 53 ab b4"],
      ["7136 2ff8 972c dac5 de47 d2cb 5324 38a1 1480 357a 1d98 009e 6eb6 9f60 bafc b54e","07 68 a5 c6"],
      ["7097 9dce 35e0 fc8f 3054 7be4 6d4b 6f84 81d5 8abd 9262 01ca 7aa1 c621 e3bf 9532","07 3f 6d f9"],
      ["8490 9ee4 a989 7c46 f5ca 7fbc 243e 7ab1 ff75 523d 3610 82ed 1c28 10d6 a0d6 3b5b","2a 57 c1 db f3"],
      ["557c 4f25 a472 9e69 fa15 d028 b7af 096b d6eb d1d1 e8ae f387 3423 6410 c8bc 0c39","05 58 74 ec f0"],
      ["1eeb 8a3f 01c2 c594 345f d5d7 6932 8eab bca2 8c54 7f10 20b0 76a1 7696 483f de9d","20 43 5d 8b 99"],
      ["ed30 5338 ef70 f8b4 81g9 14cd d672 7016 e2b1 259g fca5 9a08 3ca4 49a2 6dge 57f6 bcbg","0a 15 c3 e6 fc"],
      ["972f 335d 1d4e 28ba 0fb7 5ab0 9758 40bc g3a8 6gf2 ge9c 71f6 061d 3d8a 51cc 6e2e 49g4","21 69 ad c0 d3"],
      ["8f23 8b94 7dge 2ag0 dbc5 4188 4156 06e9 b995 3g52 10g6 0aea 6ccc 32f7 ef7b f3ad 4d17","0a 18 8b 9d ee"],
      ["83a7 be98 527d 74c7 8945 e05f a031 fddc gf1g 632g a69c 15cb 2bf4 60d0 ga2b 946e 1e83","25 5e 96 c2 ec"],
      ["61f4 7d65 1bg7 b930 2a84 4e01 dcd1 2303 ccg8 b0af e28g 9f92 369e bag5 65dc e7fa 4578","17 21 72 8c ae"],
      ["3d80 71ea ab6g c44d f1gf 57c8 7e52 0281 ce59 9134 d6gb 2dc9 3a2f 5fb6 6b04 8g79 e3a0","03 17 8c b2 ge"],
      ["5f51 dd11 09f4 c136 4dg9 5c77 cg0b fg48 6a9d 8822 024e 02bf aa75 3e3b 67a6 eceg 893b","1d 3b 6c e6 fe"],
      ["3c84 2gbd b1ae 7b16 36d8 fa7f 29be 235e 5cc5 1ga1 4gf0 d498 6049 02d3 67eg a95c 0f78","19 43 d0 e6 ge"],
      ["0cf0 8cde 77ef h1a1 b4g2 9h26 hab4 f4h7 5c9e 8d4g c3g6 8e3a 5bg0 60b3 2a53 2718 519d 6fd9","00 4b 6h 7f ac"],
      ["g95h 5bc4 49g1 db0e 791f 0aa2 0d72 9406 4818 2hbf cc3g 2hd3 f173 dhc3 856f b8ga 76ea 5ee6","24 3h 47 6e dd"],
      ["25ab 0efa ahh0 17d0 85dc gc6c 88h5 eg96 3f6g 11c4 42af b71h 5306 ebe9 b97f 3489 2d4d 7g32","0g 48 5h f3 g2"],
      ["461f 8aga fc75 6137 942h ecg4 400c 9bb2 fb72 f8e5 d033 e8he 9ahg 66d0 23gc 1h55 da9d 7b18","1b 5e 7h 81 d6"],
      ["3587 0951 af95 fg21 2989 730e 13fa 34c7 4hde h5bc heh6 a1cb 66gd g0fd bd24 8c7e g042 6ab8","10 42 61 9h dg"],
      ["9eh3 5b7g h63b ad8g 2f7d 8be6 0594 cg35 4ad7 a28h 9cf7 cd5b 44f2 9103 68c0 011a fe6e 12gh","48 7b a2 e6 h1"],
      ["b2a3 a84d 6be6 554d b041 ga2e 77ff e9b7 a983 512d 8h4e 317f gh1d ghg5 90cc 29cf 06h8 0c36","26 4b 67 8a g0"],
      ["f467 iccf ge52 59bd 34a1 10h0 c0i8 51i2 5698 dg17 374b ed72 dh86 haba egb4 f963 fhc9 2iga 30e8","1i 2g 35 51 99"],
      ["dfb8 3h90 e96e db76 7hch ea80 2f73 8d5g 31g5 a420 89gi acb7 i5fd habi e60g i411 2c64 c359 2f14","05 3d 76 a8 h9"],
      ["fbea 9d21 febf i8cg 629h g5f6 8b70 2e0c 5hd8 eh4i 1798 33a3 350d 20ai 7dg6 1cha 4g59 4417 ibc6","19 30 46 9e f1"],
      ["0430 affd 475d acg6 48i0 912b 5a3g e678 2hi1 beed 5gda efh5 617h 79bc b6ch 231i 92i4 g80f 89c3","1d 24 c6 ff g9 i8"],
      ["i9c7 859g 6bc4 012e f872 ia4f b61d a8ab 33d6 1i7d 2ghb 4f81 ah75 0403 90ec i5hc 253d eehg f69g","17 4f 91 cd g2 ih"],
      ["adhb gf8h a2ff 9d08 009i 15g3 418a ib69 7cg5 66i8 b4d2 e32g 0c5h b7c1 h736 e3ed 2417 a4c5 ie9f","1g 39 96 c8 fe g2"],
      ["a5cc 3gh9 5fia 8bf7 220f 40gb gf3e 36h7 90d9 634b hag4 e82a c025 1679 1e4d ih8b 86i5 di17 ec1d","0a 42 73 9h cc g8"],
      ["d3b9 cfc2 0a8d 4g7d 9h25 536b 1ech 0gef 7g7b a54g 7149 0cii 12hi f3e6 8afi 235a h089 1db6 648e","1c 49 55 70 ce i6"],
      ["jf21 77c1 de4b 8j9c 0fif 503j 50e8 ii0f 7cga 323h a3ea 79g9 6hbe 41d2 4j6b 265g a8dh cb5g 689h 4di1","19 38 8b aa hc j4"],
      ["dedi ga18 5a4e 6jdj 2if9 ge6f a7f0 hc34 5j8j 22h8 f9gg 436c 1b79 c806 943a 0ceh hid3 5b51 701i 2b7b","36 4j 6a af dc e9"],
      ["ag67 8he3 6j90 52hc gf51 8i24 b41c 9d40 ib9d f3j9 0ecg 3c75 f2b8 1ag2 dai6 i7dh j6e0 h58j 4e3b a17f","26 4g 58 b3 gj hh"],
      ["1917 5i56 89fj fgci 0hfb g6i3 715j 9b3j e6be a2cd 4ach 2e17 c98b 3h0j d5a7 d4fd 08g2 34ae 2864 ghi0","34 67 bi dh i2 jg"],
      ["iej9 822h 6da9 bi9a j451 2j18 750g i3gc 038f 3dae gh97 f5f7 da4h b6cb j437 fch0 egc1 ib58 d024 16e6","52 67 bf cd f5 ia"],
      ["3g60 h72d cfh9 1ae6 34a5 0eej h85c 491h 1fb2 bf67 5b6g 45j7 39i7 i290 8ec0 adbc gdaf 81gj dij8 423i","2c 81 b4 di fa h8"],
      ["iag3 g6d7 9e72 gb6a h1jc 14f0 b5af 4fg1 0i32 d3hh e8ce 7c95 ha6c 0f4i 85i7 j1b4 9d8d 8jb9 5623 e20j","2f 3g 51 b7 ch e2"],
      ["85f6 h0h6 4hij 5149 c43c 879d 229g ieei 20ia 85hg d3ba b6ae 71jj f7a1 063c dc10 jfg2 3b47 deb9 gf85","96 bb fa gj h3 jg"],
      ["128a e443 ka75 79j9 6f54 0cg1 1j3e db08 hd7e h6f2 bic0 bi0g 9ck8 3i9d 6gha b61j akif e745 kh82 3j2g 5fcd","1f 42 7d 8h a0 di"],
      ["ke16 g23g 7ek0 f30f 5419 b0a6 g4d7 b7ci j589 h6e3 af4j j455 2bed bh8f i82a 0jc2 7h98 ka1h 1ckd 63cd gi9i","27 45 6e c2 j6 kc"],
      ["hj10 ec24 k8jg 1159 872k di4i 5084 a73j d67b cgeg c7bi 6106 gb49 f2kh f9ha 23jb f9ie a3cd 658k adhe 035f","2k 31 48 65 ac i6"],
      ["14fj cii7 e52k 6h6b g725 49f9 j8c9 ed1h 3327 ckgd g582 ghab 08j0 ak46 3614 1bik h7ca 8dde i05b afj3 f9e0","01 27 36 e3 f9 gh"],
      ["cdf6 aij4 2e1e k0be 2k1b hfc1 0ajg k8kc 4djd g855 33b7 7ca7 d3hi 97f6 g608 5609 19i3 4i5g 84hj eba2 fh92","0c 3i 5h 7k ej i8"],
      ["2b49 d6ih a078 1332 56e3 bg8d j99i 98ak 5hck 4a1g 0604 kgfi h5e2 chdb d8ej fcfj e4bj g7a0 7ik1 62cf 7135","02 16 6j 79 94 k7"],
      ["6if2 3j1b 5871 5d9e j5di gb9d h0i7 1g48 fjdf c6kh 99eg 3c87 85je ka24 gibc a33h ef6c 1224 600b 407a akhk","4j bd c8 e0 h1 j4"],
      ["h3gd 00d4 69f2 j6k8 28gj fa0d d9hk 6i2a 0b6a ge1i 9c78 35ij 58b9 1k4c 7ei3 fa45 4g1b bkh3 j5ee 1cfc 7h27","26 d1 e9 g4 i8 k7"],
      ["g327 6laj f11i 9c21 g3bf 5c8h k8ld 550e 5agi cb9h 7jeb 3644 d4il 8ljh 23ed g41a 0kce 82f6 9k09 k7ji afd0 b6h7","2f 34 50 cd i9 jk lb"],
      ["dae9 ef6l d21b kfha b14i 0289 j0a0 54cb 7gig ka4g dg6k l938 5fi8 jef3 17h8 5i2j jl61 3be3 hc7d hc06 k42c 59l7","3i 4b 50 gj h3 jg k2"],
      ["bihd 1350 bj4a l89h 941a kf92 627i ce7e 8g6i 5jl2 e8dd h72f 5k45 9bf6 0el3 gc8i ag0a j0c7 3hdc 61lk k34b jfg1","94 ae bh dl fg ga l7"],
      ["c3e1 h912 d5jl c8a2 54b5 35jd gki0 7i48 8gkj hbh2 flak 0d1e 9f7c k6bl gj0a cf1e 4063 94fl 6e97 d32i ahb6 8i7g","0i 7f 90 ab c9 g4 l8"],
      ["g679 6jg5 b6b3 f04l 8710 ea1g d41c 5jj9 k388 dfif c2kh ib93 6j0a el45 42hk aiib 9732 hdh0 elk2 a1gc ce7l d5f8","17 5e bi e4 i2 kc ld"],
      ["d37d 36cb jj3a 14b9 2k4e 6407 a51g 82eb lf8a 40i2 1iei hlh7 2j17 8k8e dhc0 0cgd bf69 3ag9 fj5k 56gc 9h5k ilfl","2k 31 c2 dj eg f0 k9"],
      ["h97d h7ib c24h 89e7 j9ke 31ek aj5h l8fi f646 4d09 l63a df03 2d7c i601 bc2b gjej 1klg 3il8 5412 8gb5 f0a5 kacg","1h 53 80 al c2 di fg"],
    ],
  };
  const denseNames = {
    classic: ['晴窗长桌', '柚香木架', '玻璃花园', '果站新柜', '盛夏长廊', '清透彩窗', '虹色满架'],
    mystery: ['晨雾满架', '雾巷果摊', '薄云深处', '窗影叠色', '暮色果阵', '夜雾长柜', '藏尽虹色'],
    recipe: ['柜边集签', '午市清单', '分桌交杯', '果铺调配', '云下订单', '长架分配', '全色配签'],
  };

  function denseCampaign(mode) {
    return denseBoards[mode].map((board, index) => {
      const [rows, goals] = Array.isArray(board) ? board : [board, ''];
      const sequence = String(index % 10 + 1).padStart(2, '0');
      return parseLevel([`${denseNames[mode][Math.floor(index / 10)]} · ${sequence}`, rows, goals], mode === 'mystery');
    });
  }

  const modes = {
    classic: {
      name: '经典整理',
      description: '看清每一层，把同色果饮倒在一起。',
      levels: [...campaign.classic.map(level => parseLevel(level, false)), ...denseCampaign('classic')],
    },
    mystery: {
      name: '迷雾揭晓',
      description: '从第 4 关起，倒开上层才知道下面的颜色。',
      levels: [...original, ...campaign.mystery.map(level => parseLevel(level, true)), ...denseCampaign('mystery')],
    },
    recipe: {
      name: '定向装瓶',
      description: '查看瓶上的标签，最后把指定颜色装满对应的瓶子。',
      levels: [...campaign.recipe.map(level => parseLevel(level, false)), ...denseCampaign('recipe')],
    },
  };
  const levels = modes.mystery.levels;

  function create(levelIndex, mode = 'mystery') {
    const level = modes[mode]?.levels[levelIndex];
    if (!level) throw new RangeError('未知关卡');
    return {
      bottles: level.bottles.map(bottle => bottle.slice()),
      revealed: level.bottles.map(bottle => bottle.map((_, index) => !level.fog || index === bottle.length - 1)),
      goals: { ...level.goals },
      moves: 0,
      extra: 0,
    };
  }

  function isCompleteBottle(bottle) {
    return bottle.length === capacity && bottle.every(color => color === bottle[0]);
  }

  function isSolved(state) {
    return state.bottles.every((bottle, index) => {
      const goal = state.goals?.[index];
      if (goal !== undefined) return isCompleteBottle(bottle) && bottle[0] === goal;
      return bottle.length === 0 || isCompleteBottle(bottle);
    });
  }

  function top(bottle) {
    return bottle[bottle.length - 1];
  }

  function visibleRun(bottle, known) {
    const color = top(bottle);
    let count = 0;
    for (let index = bottle.length - 1; index >= 0; index--) {
      if ((known && !known[index]) || bottle[index] !== color) break;
      count++;
    }
    return count;
  }

  function pour(state, from, to) {
    const source = state.bottles[from];
    const destination = state.bottles[to];
    if (!source || !destination) return { ok: false, reason: 'missing' };
    if (from === to) return { ok: false, reason: 'same' };
    if (!source.length) return { ok: false, reason: 'empty' };
    if (destination.length === capacity) return { ok: false, reason: 'full' };

    const color = top(source);
    if (destination.length && top(destination) !== color) return { ok: false, reason: 'color' };
    const amount = Math.min(visibleRun(source, state.revealed[from]), capacity - destination.length);
    if (!amount) return { ok: false, reason: 'empty' };

    const split = source.length - amount;
    const bottles = state.bottles.slice();
    const revealed = state.revealed.slice();
    bottles[from] = source.slice(0, split);
    bottles[to] = destination.concat(source.slice(split));
    revealed[from] = state.revealed[from].slice(0, split);
    revealed[to] = state.revealed[to].concat(state.revealed[from].slice(split));
    if (split) revealed[from][split - 1] = true;

    const completed = isCompleteBottle(bottles[to]);
    if (completed) revealed[to].fill(true);
    const next = { ...state, bottles, revealed, moves: state.moves + 1 };
    return { ok: true, state: next, amount, color, completed, won: isSolved(next) };
  }

  function addBottle(state) {
    return {
      ...state,
      bottles: [...state.bottles, []],
      revealed: [...state.revealed, []],
      extra: state.extra + 1,
    };
  }

  // Mask every unrevealed layer before looking for a suggestion. Hidden colors
  // can be used by the game rules after a pour, but cannot affect the hint.
  function publicBoard(state) {
    return state.bottles.map((bottle, index) => bottle.map((color, layer) =>
      state.revealed[index][layer] ? color : -1));
  }

  function isPublicComplete(bottle) {
    return bottle[0] >= 0 && isCompleteBottle(bottle);
  }

  function candidateMoves(board, goals) {
    const candidates = [];
    for (let from = 0; from < board.length; from++) {
      const source = board[from];
      if (!source.length) continue;
      const color = top(source);
      if (color < 0) continue;
      const sourceGoal = goals[from];
      if (isPublicComplete(source) && sourceGoal === color) continue;
      const run = visibleRun(source);
      const destinations = new Set();
      for (let to = 0; to < board.length; to++) {
        const target = board[to];
        const targetGoal = goals[to];
        if (to === from || target.length === capacity) continue;
        if (target.length && top(target) !== color) continue;
        // Moving an entire single-color bottle to an equivalent empty bottle
        // changes the positions, but cannot help progress toward a solution.
        if (!target.length && run === source.length && sourceGoal === targetGoal) continue;
        const key = `${targetGoal ?? '_'}:${target.join(',')}`;
        if (destinations.has(key)) continue;
        destinations.add(key);

        const count = Math.min(run, capacity - target.length);
        const remainder = source.length - count;
        const exposesUnknown = remainder > 0 && source[remainder - 1] === -1;
        const finishesColor = target.length + count === capacity && target.every(unit => unit === color);
        let score = count * 2 + (target.length ? 45 : 0) + (remainder ? 0 : 32)
          + (exposesUnknown ? 25 : 0) + (finishesColor ? 90 : 0);
        if (targetGoal === color) score += 45;
        else if (targetGoal !== undefined) score -= 40;
        if (sourceGoal !== undefined && sourceGoal !== color) score += 26;
        candidates.push({ from, to, count, score });
      }
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  function visibleSolution(board, opening, goals) {
    const visited = new Set();
    const tagged = Object.keys(goals).length > 0;
    const dense = board.length > 14;
    const budget = dense ? (tagged ? 1300 : 700) : (tagged ? 2800 : 900);
    const maxDepth = dense ? 120 : 65;
    let states = 0;
    function solve(current, depth) {
      if (current.every((bottle, index) => {
        const goal = goals[index];
        if (goal !== undefined) return isPublicComplete(bottle) && bottle[0] === goal;
        return !bottle.length || isPublicComplete(bottle);
      })) return true;
      if (++states > budget || depth > maxDepth) return false;
      const key = current.map((bottle, index) => `${goals[index] ?? '_'}:${bottle.join(',')}`).sort().join('|');
      if (visited.has(key)) return false;
      visited.add(key);
      return candidateMoves(current, goals).some(move => solve(projectMove(current, move), depth + 1));
    }
    return opening.find(move => solve(projectMove(board, move), 1)) || null;
  }

  function projectMove(board, { from, to, count }) {
    const result = board.slice();
    result[from] = board[from].slice(0, -count);
    result[to] = board[to].concat(board[from].slice(-count));
    return result;
  }

  function boardKey(board) {
    return board.map(bottle => bottle.join(',')).join('|');
  }

  function avoidRepeats(board, moves, history) {
    if (!history.length) return moves;
    const prior = new Set(history.map(previous => boardKey(publicBoard(previous))));
    return moves.filter(move => {
      const projected = projectMove(board, move);
      // An exposed question mark will gain information, regardless of its
      // color. Do not guess what that layer will become.
      if (top(projected[move.from]) === -1) return true;
      return !prior.has(boardKey(projected));
    });
  }

  function hint(state, history = []) {
    const board = publicBoard(state);
    const goals = state.goals || {};
    const moves = avoidRepeats(board, candidateMoves(board, goals), history);
    if (!moves.length) return null;
    const fog = board.some(bottle => bottle.includes(-1));
    const move = fog ? moves[0] : visibleSolution(board, moves, goals) || moves[0];
    return { from: move.from, to: move.to };
  }

  globalThis.PourGame = { colors, levels, modes, create, pour, addBottle, isSolved, isCompleteBottle, hint };
})();
