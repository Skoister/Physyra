/* ================= BODY//TIME app ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SYS = {
  cardio: { name: 'Cardiovascular', v: '--cardio' },
  resp: { name: 'Respiratory', v: '--resp' },
  nervous: { name: 'Nervous system', v: '--nervous' },
  thermo: { name: 'Thermoregulation', v: '--thermo' },
  fluid: { name: 'Metabolism & fluids', v: '--fluid' }
};

/* ---------- channels ---------- */
const CH = [
  { id: 'sym', label: 'Sympathetic drive', unit: 'index', sys: 'nervous', dec: 0, span: 40, dom: [0, 110],
    txt: { up: 'Fight-or-flight signals are strengthening. The brain is asking the heart and blood vessels to do more.',
      down: 'Sympathetic signals are easing as the vagus nerve and calm take over.',
      flat: 'Nervous system drive is holding steady.' },
    mech: 'Sympathetic neurons in the spinal cord are driven by the brainstem (baroreflex and chemoreflex), the hypothalamus (temperature, threat) and higher brain centres. They act through noradrenaline on the heart and vessels and adrenaline from the adrenal glands.',
    causes: ['bp', 'pco2', 'spo2'], affects: ['hr', 'width'] },
  { id: 'hr', label: 'Heart rate', unit: 'bpm', sys: 'cardio', dec: 0, span: 30, dom: [40, 190],
    txt: { up: 'The heart is beating faster to move more blood each minute.',
      down: 'The heart is slowing, either because demand has dropped or because the vagus nerve is applying the brakes.',
      flat: 'Heart rate is steady.' },
    mech: 'The sinoatrial node sets the rhythm. Vagal input slows it and sympathetic input speeds it, and the two respond within a beat or two and a few seconds respectively. Core temperature adds roughly 10 beats per minute for every degree.',
    causes: ['sym', 'temp'], affects: ['co', 'bp'] },
  { id: 'bp', label: 'Blood pressure', unit: 'mmHg', sys: 'cardio', dec: 0, span: 40, dom: [40, 200],
    txt: { up: 'Pressure is rising because the heart is pumping more, the vessels are narrowing, or both.',
      down: 'Pressure is falling because less blood is being pumped or the vessels are opening up.',
      flat: 'Pressure is being held steady. Pressure sensors keep adjusting the heart and vessels to protect it.' },
    mech: 'Mean arterial pressure is roughly cardiac output multiplied by vascular resistance. Systolic pressure follows stroke volume, and diastolic pressure follows resistance and heart rate. The baroreflex corrects errors within seconds; the kidneys take over across hours.',
    causes: ['co', 'width', 'bv'], affects: ['sym'] },
  { id: 'co', label: 'Cardiac output', unit: 'L/min', sys: 'cardio', dec: 1, span: 3, dom: [2, 18],
    txt: { up: 'The heart is pumping more blood per minute, from faster beats, bigger beats, or both.',
      down: 'Less blood is leaving the heart each minute.',
      flat: 'Cardiac output is steady.' },
    mech: 'Cardiac output equals heart rate times stroke volume. Stroke volume depends on how much blood returns to fill the heart (the Frank\u2013Starling mechanism), how hard the muscle contracts, and the pressure it pumps against.',
    causes: ['hr', 'bv', 'sym'], affects: ['bp'] },
  { id: 'width', label: 'Vessel width', unit: '%', sys: 'cardio', dec: 0, span: 12, dom: [60, 140],
    txt: { up: 'Blood vessels are opening overall, which lowers resistance and lets blood flow more easily.',
      down: 'Blood vessels are narrowing, which raises resistance and pushes pressure up.',
      flat: 'Vessel width is steady.' },
    mech: 'Resistance scales with one over the radius to the fourth power, so a small change in diameter has a big effect. Sympathetic nerves constrict vessels; heat and chemicals released by working muscle dilate them. Shown as average width relative to rest.',
    causes: ['sym', 'temp'], affects: ['bp'] },
  { id: 'bv', label: 'Blood volume', unit: 'L', sys: 'fluid', dec: 2, span: 0.8, dom: [2.8, 5.2],
    txt: { up: 'Blood volume is recovering.',
      down: 'Blood volume is falling because fluid is leaving the body, as sweat or blood.',
      flat: 'Blood volume is steady.' },
    mech: 'Sweat and blood loss reduce plasma volume. A smaller volume means less blood returns to the heart, so each beat pumps less. Fluid shifts from tissue and the kidneys restore volume slowly, over hours.',
    causes: [], affects: ['co', 'sym'] },
  { id: 'rr', label: 'Breathing rate', unit: '/min', sys: 'resp', dec: 0, span: 12, dom: [0, 45],
    txt: { up: 'Breathing is speeding up to bring in more oxygen and clear more CO\u2082.',
      down: 'Breathing is slowing as demand falls or the CO\u2082 level drops.',
      flat: 'Breathing rate is steady.' },
    mech: 'The brainstem blends several signals: CO\u2082 in the blood and brain fluid (the strongest), low oxygen sensed by the carotid bodies, and anticipatory signals from the motor cortex and moving limbs. Heat and fever add to the drive.',
    causes: ['pco2', 'spo2', 'sym'], affects: ['pco2', 'spo2'] },
  { id: 'spo2', label: 'Blood oxygen', unit: '%', sys: 'resp', dec: 1, span: 8, dom: [60, 100],
    txt: { up: 'More oxygen is getting into the blood.',
      down: 'Oxygen is being used or lost faster than it is supplied, so saturation is starting to fall.',
      flat: 'Oxygen saturation is steady. The lungs are keeping up with demand.' },
    mech: 'Hemoglobin saturation follows an S-shaped curve. It stays high across a wide range of lung oxygen levels, then drops steeply once the pressure falls below about 60 mmHg. That is why saturation lags behind CO\u2082 in a breath-hold.',
    causes: ['rr'], affects: ['sym', 'rr'] },
  { id: 'pco2', label: 'Blood CO\u2082', unit: 'mmHg', sys: 'resp', dec: 1, span: 8, dom: [10, 70],
    txt: { up: 'CO\u2082 is building up because the body makes it faster than breathing removes it.',
      down: 'CO\u2082 is being cleared faster than it is made.',
      flat: 'CO\u2082 is steady at its set level.' },
    mech: 'Arterial CO\u2082 is proportional to CO\u2082 production divided by ventilation. Chemoreceptors in the medulla sense it through its effect on acidity, and a rise of just a few mmHg strongly increases breathing. It is the main driver of the urge to breathe.',
    causes: ['rr'], affects: ['rr', 'sym'] },
  { id: 'temp', label: 'Body temperature', unit: '\u00B0C', sys: 'thermo', dec: 1, span: 1.5, dom: [35.5, 41],
    txt: { up: 'Heat is being produced or gained faster than the body can shed it.',
      down: 'The body is losing heat faster than it makes it, through the skin and sweat.',
      flat: 'Temperature is held steady near its set point.' },
    mech: 'The hypothalamus compares core temperature with a set point and drives skin blood flow, sweating and shivering. A fever raises the set point itself, so the body works to get hotter. Heat illness happens when heat loss is outrun.',
    causes: ['width'], affects: ['hr', 'rr'] }
];
const CHD = Object.fromEntries(CH.map(c => [c.id, c]));
const NORM = { hr: [60, 100], co: [4, 8], rr: [12, 20], spo2: [95, 100.5], pco2: [35, 45], temp: [36.1, 37.2], bv: [4.5, 5.5] };
CH.forEach(c => { c.norm = NORM[c.id]; });
function normRange(c) { const r = c.norm ? c.norm.slice() : null; if (r && c.id === 'hr' && A.prof === 'athlete') r[0] = 40; return r; }
function normFlag(c, v) {
  if (c.id === 'bp') return (v.sbp < 90 || v.dbp < 60) ? 'low' : (v.sbp >= 130 || v.dbp >= 90) ? 'high' : '';
  const r = normRange(c); if (!r) return '';
  const x = v[c.id]; return x < r[0] ? 'low' : x > r[1] ? 'high' : '';
}

/* ---------- scenarios ---------- */
const SCN = [
  { id: 'stand', group: 'cardio', name: 'Stand up', playSecs: 26,
    q: 'What does your body do in the first ten seconds after you stand?', start: 'Lying down, at rest' },
  { id: 'bleed', group: 'cardio', name: 'Blood loss', playSecs: 40,
    q: 'How does the body hold its pressure while it loses about a litre of blood?', start: 'At rest' },
  { id: 'hold', group: 'resp', name: 'Hold your breath', playSecs: 34,
    q: 'What changes first when you stop breathing, and what makes you give up?', start: 'At rest' },
  { id: 'stress', group: 'nervous', name: 'Acute stress', playSecs: 40,
    q: 'What does a sudden threat do to the body, and how does it settle afterwards?', start: 'At rest' },
  { id: 'fever', group: 'thermo', name: 'Fever', playSecs: 56,
    q: 'Why do you shiver while your temperature is rising, and sweat when it breaks?', start: 'Healthy, at rest' },
  { id: 'cold', group: 'thermo', name: 'Cold exposure', playSecs: 48,
    q: 'Why do your hands go pale and your body start to shiver when you are cold?', start: 'Comfortable, at rest' },
  { id: 'heat', group: 'thermo', name: 'Heat & dehydration', playSecs: 56,
    q: 'What does two hours of walking in the heat without drinking do to the heart?', start: 'At rest, cool room' },
  { id: 'exercise', group: 'fluid', name: 'Exercise', playSecs: 56,
    q: 'What happens, in order, when you start running and when you stop?', start: 'At rest' }
];
const SCD = Object.fromEntries(SCN.map(s => [s.id, s]));

/* ---------- scripted explanations, timed by what the model actually does ---------- */
const EV = {
  stand: [
    { at: 0, sys: 'cardio', title: 'Resting state', basic: 'Blood pressure, heart rate and the spread of blood around the body are steady.', mech: 'Pressure sensors in the neck and aorta fire at a steady rate. The brainstem keeps vagal (slowing) and sympathetic (speeding) signals in balance.' },
    { at: 1, sys: 'cardio', title: 'Gravity pulls blood down', basic: 'You stand up. Blood starts to pool in the veins of the legs and belly, so less returns to the heart.', mech: 'Veins are stretchy, so around half a litre moves below the heart within a minute. Less venous return means less filling of the heart (preload).' },
    { ch: 'co', dir: -1, d: 0.2, after: 1, sys: 'cardio', title: 'The heart has less to pump', basic: 'With less blood coming back, each beat pushes out less. Cardiac output and pressure begin to fall.', mech: 'The Frank\u2013Starling mechanism: lower filling gives a smaller stroke volume. Pulse pressure narrows first because stroke volume is what sets it.' },
    { ch: 'bp', dir: -1, d: 5, after: 1, sys: 'nervous', title: 'Pressure sensors notice', basic: 'Stretch sensors in the neck and chest detect the dip and report it to the brainstem.', mech: 'Less stretch on the baroreceptors lowers their firing rate. The brainstem answers by withdrawing vagal tone and raising sympathetic output.' },
    { ch: 'hr', dir: 1, d: 5, after: 1, sys: 'nervous', title: 'The heart speeds up', basic: 'The nervous system raises heart rate and squeezes the vessels to protect blood pressure.', mech: 'Vagal withdrawal works within a beat or two. Noradrenaline then raises heart rate and contractility and narrows arterioles and veins, which also pushes blood back toward the heart.' },
    { at: 12, sys: 'cardio', title: 'A new balance', basic: 'Pressure is nearly back to normal. While you stay standing, heart rate stays a little higher and each beat a little smaller than before.', mech: 'The reflex has no way to refill the legs, so it settles on a faster heart rate and tighter vessels to hold mean pressure. Diastolic pressure ends up slightly higher.' }
  ],
  bleed: [
    { at: 0, sys: 'cardio', title: 'Resting state', basic: 'Blood volume is about five litres and everything is steady.', mech: 'Mean arterial pressure is held near 93 mmHg by the baroreflex.' },
    { at: 20, sys: 'fluid', title: 'Bleeding begins', basic: 'Blood leaves the circulation at a steady rate over two minutes.', mech: 'Loss of intravascular volume reduces venous return, so stroke volume falls even though nothing is wrong with the heart.' },
    { ch: 'bv', dir: -1, d: 0.2, after: 20, sys: 'fluid', title: 'Blood volume drops', basic: 'Less blood means less to fill the heart with on each beat.', mech: 'Low-pressure volume sensors in the atria detect the reduced filling even before arterial pressure changes.' },
    { ch: 'hr', dir: 1, d: 6, after: 20, sys: 'nervous', title: 'Heart rate rises', basic: 'The nervous system speeds the heart to make up for smaller beats.', mech: 'Sympathetic activation increases heart rate and contractility. This is the earliest reliable sign of blood loss, ahead of any fall in pressure.' },
    { ch: 'width', dir: -1, d: 2, after: 20, sys: 'cardio', title: 'Vessels tighten', basic: 'Blood vessels narrow, raising resistance so pressure is protected and blood is steered to the brain and heart.', mech: 'Arteriolar constriction raises resistance; venoconstriction squeezes stored blood back into circulation. Skin, gut and kidneys are sacrificed first.' },
    { at: 140, sys: 'cardio', title: 'Pressure held, for now', basic: 'About a litre is gone, yet pressure is close to normal. Heart rate and tight vessels are hiding the loss.', mech: 'This is compensated shock. Diastolic pressure rises and pulse pressure narrows. Pressure only collapses after roughly 30% is lost, when the reflexes run out of reserve.' }
  ],
  hold: [
    { at: 0, sys: 'resp', title: 'Resting state', basic: 'Breathing, oxygen and CO\u2082 are in balance.', mech: 'Ventilation is set so that arterial CO\u2082 sits near 40 mmHg.' },
    { at: 10, sys: 'resp', title: 'You hold your breath', basic: 'Air stops moving. Your cells keep using oxygen and making CO\u2082.', mech: 'Without ventilation, alveolar oxygen falls and CO\u2082 rises. The lungs still hold a reserve of oxygen, so this takes a while to matter.' },
    { ch: 'hr', dir: -1, d: 8, after: 10, sys: 'nervous', title: 'The heart slows', basic: 'Holding your breath triggers a mild diving reflex that slows the heart and tightens blood vessels.', mech: 'Vagal slowing and peripheral vasoconstriction save oxygen for the brain and heart. It is weak in air but much stronger in cold water.' },
    { ch: 'pco2', dir: 1, d: 1.5, after: 10, sys: 'resp', title: 'CO\u2082 starts to build', basic: 'CO\u2082 rises first, and it is the CO\u2082, not low oxygen, that creates the urge to breathe.', mech: 'Central chemoreceptors in the medulla respond to the rise in CO\u2082 through its effect on acidity in the brain fluid.' },
    { ch: 'spo2', dir: -1, d: 3, after: 10, sys: 'resp', title: 'Oxygen finally falls', basic: 'Blood oxygen holds steady for a long time and then starts to fall.', mech: 'The oxygen\u2013hemoglobin curve is flat at high pressures, so saturation barely moves until the lung oxygen has fallen a long way.' },
    { ch: 'bp', dir: 1, d: 5, after: 10, sys: 'nervous', title: 'Pressure creeps up', basic: 'Rising CO\u2082 and falling oxygen switch on the sympathetic nerves, tightening the vessels.', mech: 'Chemoreflex activation raises sympathetic outflow, which raises vascular resistance and blood pressure.' },
    { at: 65, sys: 'resp', title: 'You breathe again', basic: 'Fast, deep breaths wash out the CO\u2082 within about twenty seconds. Oxygen recovers soon after.', mech: 'Ventilation overshoots because chemoreceptors are still seeing high CO\u2082. The heart rate and blood pressure return to baseline as the chemoreflex drive fades.' }
  ],
  stress: [
    { at: 0, sys: 'nervous', title: 'Resting state', basic: 'Calm, with vagal and sympathetic signals in balance.', mech: 'Vagal tone keeps resting heart rate lower than the heart\u2019s own intrinsic rate.' },
    { at: 10, sys: 'nervous', title: 'A threat appears', basic: 'Threat circuits in the brain switch on the body\u2019s alarm system.', mech: 'The amygdala drives the hypothalamus, which activates sympathetic neurons and, through the pituitary, the stress hormone axis.' },
    { ch: 'sym', dir: 1, d: 6, after: 10, sys: 'nervous', title: 'Fight-or-flight engages', basic: 'Sympathetic nerves and adrenaline prepare the body for action.', mech: 'Preganglionic sympathetic neurons release acetylcholine onto ganglia and the adrenal medulla, which releases adrenaline into the blood.' },
    { ch: 'hr', dir: 1, d: 10, after: 10, sys: 'cardio', title: 'The heart races', basic: 'Heart rate rises within seconds and each beat is stronger.', mech: 'Beta-adrenergic receptors in the heart increase pacemaker rate and contractility.' },
    { ch: 'bp', dir: 1, d: 28, after: 10, sys: 'cardio', title: 'Blood pressure climbs', basic: 'More blood is pumped and many vessels narrow, so pressure rises.', mech: 'Higher cardiac output and alpha-adrenergic vasoconstriction in skin and gut raise mean pressure, while muscle vessels open to prepare for action.' },
    { at: 70, sys: 'nervous', title: 'The threat passes', basic: 'The alarm ends. Calming signals take over.', mech: 'Parasympathetic (vagal) activity rebounds as sympathetic drive falls.' },
    { ch: 'hr', dir: -1, d: 10, after: 70, sys: 'nervous', title: 'Rest-and-digest', basic: 'The vagus nerve slows the heart and relaxes vessels, briefly taking pressure and heart rate below where they started.', mech: 'Vagal dominance lowers heart rate and diastolic pressure for a short time before everything drifts back to baseline.' }
  ],
  fever: [
    { at: 0, sys: 'thermo', title: 'Healthy and at rest', basic: 'Core temperature is held at about 37 \u00B0C.', mech: 'The hypothalamic set point matches body temperature, so heat production and loss are balanced.' },
    { at: 600, sys: 'thermo', title: 'The set point is raised', basic: 'Immune signals tell the brain\u2019s thermostat to aim higher. Your body now treats 37 \u00B0C as too cold.', mech: 'Pyrogens such as interleukin-1 and interleukin-6 raise prostaglandin E\u2082 in the hypothalamus, which resets the set point upward.' },
    { ch: 'width', dir: -1, d: 1.5, after: 600, sys: 'cardio', title: 'Skin vessels narrow', basic: 'Blood is pulled away from the skin to keep heat in. This is why you feel cold and look pale.', mech: 'Sympathetic cutaneous vasoconstriction reduces heat loss, and shivering adds heat production.' },
    { ch: 'temp', dir: 1, d: 0.3, after: 600, sys: 'thermo', title: 'Temperature climbs', basic: 'Shivering makes heat and the skin loses less of it, so core temperature rises.', mech: 'Shivering can triple resting heat production. Metabolic rate rises, about 10% for each degree.' },
    { ch: 'rr', dir: 1, d: 6, after: 600, sys: 'resp', title: 'Breathing quickens', basic: 'Shivering makes more CO\u2082, and heat itself nudges breathing faster.', mech: 'Higher CO\u2082 production and higher temperature both raise the ventilatory drive.' },
    { ch: 'temp', dir: 1, d: 1.8, after: 600, sys: 'thermo', title: 'The new set point is reached', basic: 'Temperature levels off near 39 \u00B0C and the chills stop.', mech: 'When core temperature meets the raised set point, the heat-conserving responses switch off and the body defends the new temperature.' },
    { at: 7200, sys: 'thermo', title: 'The fever breaks', basic: 'The set point drops back to normal. Now 39 \u00B0C feels far too hot.', mech: 'When the pyrogen signal fades, the set point resets and the body treats the temperature excess as an error to correct.' },
    { ch: 'temp', dir: -1, d: 1, after: 7200, sys: 'thermo', title: 'Sweat and flushed skin cool you', basic: 'Skin vessels open and sweating starts, so heat pours out. Blood pressure dips a little as the vessels widen.', mech: 'Cutaneous vasodilation and evaporative loss can remove several hundred watts, cooling the core at roughly a degree every few minutes.' }
  ],
  heat: [
    { at: 0, sys: 'thermo', title: 'Resting in a cool room', basic: 'Temperature, heart rate and blood volume are at baseline.', mech: 'Skin blood flow is modest and there is almost no sweating.' },
    { at: 300, sys: 'thermo', title: 'A hot walk begins', basic: 'You start walking in a hot environment and have nothing to drink.', mech: 'Metabolic heat from walking is added to heat gained from the environment, so the body has to work hard to shed it.' },
    { ch: 'hr', dir: 1, d: 15, after: 300, sys: 'cardio', title: 'Heart rate rises', basic: 'The heart speeds up for the walking and for the extra blood sent to the skin.', mech: 'Exercise drive and skin vasodilation both lower vascular resistance, so the heart has to raise output.' },
    { ch: 'width', dir: 1, d: 8, after: 300, sys: 'cardio', title: 'Skin vessels open', basic: 'More blood flows through the skin so heat can escape to the air.', mech: 'Active cutaneous vasodilation can take a large share of cardiac output, reducing central blood volume.' },
    { ch: 'temp', dir: 1, d: 0.5, after: 300, sys: 'thermo', title: 'Core temperature climbs', basic: 'Heat is arriving faster than it leaves, so temperature rises until sweating catches up.', mech: 'Sweating starts once core temperature crosses a threshold and its rate rises with temperature.' },
    { ch: 'bv', dir: -1, d: 0.1, after: 300, sys: 'fluid', title: 'Sweat drains blood volume', basic: 'Sweat is made from body water, including the watery part of blood. With no drinking, blood volume slowly falls.', mech: 'Plasma volume falls as sweat is produced, and the blood becomes more concentrated.' },
    { ch: 'hr', dir: 1, d: 6, after: 1800, sys: 'cardio', title: 'Heart rate drifts upward', basic: 'With less blood to fill the heart, each beat is smaller. Heart rate creeps up to make up for it.', mech: 'This is cardiovascular drift. It persists even at constant effort and is one reason dehydration makes exercise feel harder.' }
  ],
  cold: [
    { at: 0, sys: 'thermo', title: 'Comfortable and at rest', basic: 'Core temperature is steady at about 37 \u00B0C and skin blood flow is moderate.', mech: 'Heat production and heat loss are balanced.' },
    { at: 240, sys: 'thermo', title: 'You step into the cold', basic: 'The air is cold enough that you lose heat faster than your body makes it.', mech: 'Heat loss by convection and radiation grows with the gap between skin and air temperature.' },
    { ch: 'width', dir: -1, d: 1.5, after: 240, sys: 'cardio', title: 'Skin vessels narrow', basic: 'Blood is pulled away from the skin to keep warm blood near the core. Hands and feet turn pale and cold.', mech: 'Sympathetic nerves constrict skin arterioles, which thickens the insulating shell of cool tissue around the core.' },
    { ch: 'bp', dir: 1, d: 5, after: 240, sys: 'cardio', title: 'Blood pressure creeps up', basic: 'Narrower vessels raise resistance, so pressure rises a little.', mech: 'Higher peripheral resistance raises mean pressure, and blood shifts toward the centre of the body, which is why cold makes you need the toilet.' },
    { ch: 'rr', dir: 1, d: 3, after: 240, sys: 'resp', title: 'Breathing quickens', basic: 'Shivering burns fuel, so the body makes more CO\u2082 and breathes faster.', mech: 'Shivering thermogenesis and the cold shock response both raise ventilation.' },
    { ch: 'temp', dir: -1, d: 0.4, after: 240, sys: 'thermo', title: 'Core temperature drifts down', basic: 'Even with these defences, the body loses slightly more heat than it makes, so core temperature slowly falls.', mech: 'Shivering can raise heat production several-fold, but sustained cold can still win. Below about 35 \u00B0C is hypothermia.' }
  ],
  exercise: [
    { at: 0, sys: 'cardio', title: 'Resting state', basic: 'Heart rate, breathing and temperature are at baseline.', mech: 'Oxygen use is about 3.5 mL per kilogram per minute.' },
    { at: 20, sys: 'nervous', title: 'You start to run', basic: 'The brain sends commands to the muscles and, at the same instant, to the heart and lungs.', mech: 'This feed-forward signal is called central command. Limb sensors add further drive once movement starts.' },
    { ch: 'hr', dir: 1, d: 8, after: 20, sys: 'nervous', title: 'Heart rate jumps within seconds', basic: 'The heart speeds up before the muscles have used much oxygen.', mech: 'Central command withdraws vagal tone first, then raises sympathetic drive.' },
    { ch: 'rr', dir: 1, d: 10, after: 20, sys: 'resp', title: 'Breathing deepens and quickens', basic: 'Breathing rises ahead of any change in blood gases, led by brain and limb signals.', mech: 'Feed-forward ventilatory drive keeps CO\u2082 near normal even though its production rises many-fold.' },
    { ch: 'co', dir: 1, d: 4, after: 20, sys: 'cardio', title: 'Cardiac output climbs', basic: 'Faster and larger beats mean the heart pumps two to three times as much blood per minute.', mech: 'Muscle contractions squeeze veins and return more blood to the heart, which raises stroke volume.' },
    { ch: 'width', dir: 1, d: 8, after: 20, sys: 'cardio', title: 'Muscle vessels open', basic: 'Working muscles release chemicals that widen their vessels so more blood goes where it is needed.', mech: 'Potassium, adenosine, acidity and nitric oxide dilate muscle arterioles. Total resistance falls even while other vessels are narrowed by sympathetic nerves.' },
    { ch: 'temp', dir: 1, d: 0.3, after: 20, sys: 'thermo', title: 'Body heat builds', basic: 'Muscles turn most of the energy they use into heat, so core temperature climbs.', mech: 'The hypothalamus opens skin vessels and starts sweating once the core passes its threshold.' },
    { at: 480, sys: 'cardio', title: 'You stop', basic: 'The commands stop. Heart rate and breathing fall quickly at first, then more slowly.', mech: 'The fast phase is the end of central command. The slow phase is metabolic recovery, and temperature has to be shed.' },
    { ch: 'temp', dir: -1, d: 0.2, after: 480, sys: 'thermo', title: 'Heat is still being shed', basic: 'Temperature stays high for a while after you stop because the heat has to leave through the skin.', mech: 'Sweating and skin blood flow continue until core temperature returns to the set point.' }
  ]
};

/* ---------- control loops ---------- */
const LOOP = {
  stand: [
    { text: 'Blood pools in the legs and less returns to the heart', at: 1 },
    { text: 'Baroreceptors in the carotid sinus and aortic arch sense less stretch', ch: 'bp', dir: -1, d: 5, after: 1 },
    { text: 'The medulla raises sympathetic and lowers vagal output', ch: 'sym', dir: 1, d: 1.5, after: 1 },
    { text: 'The heart\u2019s pacemaker and the blood vessels respond', ch: 'hr', dir: 1, d: 5, after: 1 },
    { text: 'Heart rate rises, vessels narrow and pressure recovers', ch: 'bp', dir: 1, d: 3, after: 2 }],
  bleed: [
    { text: 'Blood volume falls', ch: 'bv', dir: -1, d: 0.2, after: 20 },
    { text: 'Volume sensors in the atria and pressure sensors in the arteries detect it', ch: 'bv', dir: -1, d: 0.4, after: 20 },
    { text: 'The brainstem raises sympathetic output', ch: 'sym', dir: 1, d: 3, after: 20 },
    { text: 'Arterioles, veins and the heart respond', ch: 'width', dir: -1, d: 2, after: 20 },
    { text: 'Heart rate rises and pressure is held near normal', ch: 'hr', dir: 1, d: 10, after: 20 }],
  hold: [
    { text: 'CO\u2082 builds up in the blood', ch: 'pco2', dir: 1, d: 1.5, after: 10 },
    { text: 'Chemoreceptors in the carotid bodies and medulla detect it', ch: 'pco2', dir: 1, d: 3, after: 10 },
    { text: 'The brainstem raises sympathetic output and the urge to breathe', ch: 'bp', dir: 1, d: 5, after: 10 },
    { text: 'The breathing muscles and the blood vessels respond', at: 65 },
    { text: 'Deep, fast breaths wash the CO\u2082 out', ch: 'rr', dir: 1, d: 10, after: 65 }],
  stress: [
    { text: 'A threat is perceived', at: 10 },
    { text: 'The senses and amygdala alert the hypothalamus', at: 10.5 },
    { text: 'The hypothalamus and brainstem switch on sympathetic nerves', ch: 'sym', dir: 1, d: 4, after: 10 },
    { text: 'The adrenal glands, heart and vessels respond', ch: 'hr', dir: 1, d: 10, after: 10 },
    { text: 'Heart rate and pressure rise to prepare you for action', ch: 'bp', dir: 1, d: 28, after: 10 }],
  fever: [
    { text: 'Immune signals raise the thermostat\u2019s set point', at: 600 },
    { text: 'The hypothalamus finds the body too cold compared with the new set point', at: 601 },
    { text: 'The hypothalamus orders heat to be saved and made', ch: 'width', dir: -1, d: 1.5, after: 600 },
    { text: 'Skin vessels narrow and muscles shiver', ch: 'width', dir: -1, d: 2.5, after: 600 },
    { text: 'Temperature climbs to the new set point', ch: 'temp', dir: 1, d: 1.8, after: 600 }],
  cold: [
    { text: 'The skin cools in cold air', at: 240 },
    { text: 'Cold receptors in the skin and the hypothalamus detect it', ch: 'width', dir: -1, d: 0.5, after: 240 },
    { text: 'The hypothalamus orders heat to be saved and made', ch: 'width', dir: -1, d: 1.5, after: 240 },
    { text: 'Skin vessels narrow and muscles begin to shiver', ch: 'bp', dir: 1, d: 5, after: 240 },
    { text: 'Core temperature is defended, though it slowly falls', ch: 'temp', dir: -1, d: 0.4, after: 240 }],
  heat: [
    { text: 'The walk and the hot air add heat to the body', at: 300 },
    { text: 'Thermoreceptors in the skin and hypothalamus detect the rise', ch: 'temp', dir: 1, d: 0.2, after: 300 },
    { text: 'The hypothalamus turns on heat-loss responses', ch: 'width', dir: 1, d: 8, after: 300 },
    { text: 'Skin vessels open and sweat glands release sweat', ch: 'temp', dir: 1, d: 0.5, after: 300 },
    { text: 'Temperature levels off, at the cost of body fluid', ch: 'bv', dir: -1, d: 0.1, after: 300 }],
  exercise: [
    { text: 'Muscles begin to demand more oxygen and the brain issues central command', at: 20 },
    { text: 'Sensors in muscles and joints and chemoreceptors report in', ch: 'sym', dir: 1, d: 4, after: 20 },
    { text: 'The brainstem and hypothalamus raise sympathetic drive and ventilation', ch: 'hr', dir: 1, d: 8, after: 20 },
    { text: 'The heart, lungs and muscle vessels respond', ch: 'co', dir: 1, d: 4, after: 20 },
    { text: 'Cardiac output rises and oxygen delivery keeps up with demand', ch: 'width', dir: 1, d: 8, after: 20 }]
};

/* ---------- case files ---------- */
const CASE = {
  stand: { label: 'Standing up after lying down', r: [4, 12], clues: 'Within seconds of standing, pressure dipped and the gap between systolic and diastolic narrowed, because less blood was returning to the heart. Heart rate rose only modestly as the baroreflex compensated. Blood volume, temperature and breathing were normal.' },
  bleed: { label: 'Blood loss', r: [110, 300], clues: 'Heart rate is up and the pulse pressure is narrow, yet blood pressure is close to normal. Blood volume is low while temperature and breathing are unremarkable. That is compensated blood loss, where the nervous system is hiding the problem.' },
  hold: { label: 'Holding their breath', r: [45, 64], clues: 'Breathing rate is zero, CO\u2082 is rising, oxygen has barely dropped, and heart rate is slow while pressure creeps up. That is a breath-hold, with the diving reflex and the chemoreflex at work.' },
  stress: { label: 'Acute stress', r: [25, 60], clues: 'Heart rate, blood pressure and sympathetic drive are all up within the first minute, while temperature and blood volume are normal. That is the fight-or-flight response.' },
  fever: { label: 'Fever', r: [2400, 6800], clues: 'Core temperature is high without a matching rise in heart rate or breathing, and blood volume is normal. The body is defending a raised set point, which is what a fever is.' },
  heat: { label: 'Heat and dehydration', r: [2400, 7000], clues: 'Temperature is high, breathing is fast, heart rate is high and blood volume has fallen after an hour or more. Sweat loss in the heat is draining blood volume, and the heart is working harder to make up for it.' },
  exercise: { label: 'Exercise', r: [150, 470], clues: 'Heart rate, breathing and cardiac output are all very high, blood oxygen and CO\u2082 are steady, and temperature has only risen a little. Faster pumping and breathing are meeting the muscles\u2019 demand.' },
  cold: { label: 'Cold exposure', r: [900, 2300], clues: 'Temperature is below normal, vessels are narrowed and blood pressure is up. The body is saving heat by narrowing skin vessels while its temperature slowly drifts down.' }
};

/* ---------- anatomy ---------- */
const ANAT = {
  heart: { title: 'Heart', sys: 'cardio', ch: 'hr', facts: [
    'A muscular pump in the chest between the lungs, with its tip pointing to the left. It has four chambers: the right and left atria receive blood, and the right and left ventricles pump it out.',
    'The right side sends oxygen-poor blood to the lungs. The left side sends oxygen-rich blood to the rest of the body, so the left ventricle has the thickest wall.',
    'Four valves (tricuspid, pulmonary, mitral and aortic) keep blood moving one way. Each beat starts at the sinoatrial node and spreads through the atrioventricular node, the bundle of His and the Purkinje fibres. The coronary arteries feed the heart muscle itself.'],
    link: 'The heart beats at the simulated heart rate, and the signal along the vessels moves with cardiac output.' },
  lungs: { title: 'Lungs', sys: 'resp', ch: 'rr', facts: [
    'The right lung has three lobes and the left has two, leaving room for the heart. Air travels down the trachea, through the bronchi and bronchioles, and into the alveoli.',
    'Hundreds of millions of alveoli, each wrapped in capillaries, give a gas-exchange surface of tens of square metres. Oxygen crosses into the blood and CO\u2082 crosses out through a membrane less than a micrometre thick.',
    'The diaphragm and the muscles between the ribs expand the chest and draw air in. The pleura lets the lungs slide smoothly against the chest wall.'],
    link: 'The lungs expand and shrink at the simulated breathing rate, and stay inflated in a breath-hold.' },
  brain: { title: 'Brain', sys: 'nervous', ch: 'bp', facts: [
    'The brainstem (midbrain, pons and medulla) contains the cardiovascular and respiratory control centres. The medulla receives signals from pressure and chemical sensors and adjusts the heart, vessels and breathing within seconds.',
    'The hypothalamus compares body temperature with a set point and orders sweating, shivering and changes in skin blood flow. The amygdala helps trigger the stress response.',
    'The brain is about 2% of body weight but uses about 20% of the body\u2019s oxygen, so the circulation protects its blood supply first.'],
    link: 'The brain glows with its blood supply and dims when pressure falls, as in the first seconds after you stand.' },
  nerves: { title: 'Autonomic nerves', sys: 'nervous', ch: 'sym', facts: [
    'Sympathetic fibres leave the spinal cord in the chest and upper lower back, relay in a chain of ganglia beside the spine, and speed the heart and narrow vessels. The adrenal medulla also releases adrenaline into the blood.',
    'Parasympathetic fibres travel mainly in the vagus nerve (cranial nerve X) and slow the heart.',
    'Sensory nerves from pressure sensors (the carotid sinus and aortic arch) and chemical sensors (the carotid and aortic bodies) report back to the brainstem, closing the feedback loop.'],
    link: 'The dashed line along the spine moves faster and brighter as sympathetic drive rises.' },
  vessels: { title: 'Blood vessels', sys: 'cardio', ch: 'width', facts: [
    'Arteries carry blood away from the heart at high pressure, and their elastic walls smooth the pulse. Arterioles are the main resistance vessels, so a small change in their width has a large effect on pressure.',
    'Capillaries are one cell thick and are where oxygen, nutrients and waste are exchanged with tissues.',
    'Veins return blood at low pressure and hold roughly 60 to 65% of all the blood, which is why they are the reservoir that shifts when you stand. Valves and the squeeze of leg muscles help push blood back uphill.'],
    link: 'The red channel narrows and widens with average vessel width.' },
  muscle: { title: 'Skeletal muscle', sys: 'fluid', ch: 'co', facts: [
    'Skeletal muscle makes up about 40% of body mass. At rest it receives roughly a fifth of the cardiac output, and in hard exercise it can receive most of it.',
    'Working muscle widens its own arterioles using local signals such as potassium, adenosine and nitric oxide, and its contractions squeeze veins to pump blood back toward the heart.',
    'Muscle turns only about a quarter of its fuel energy into movement. The rest becomes heat.'],
    link: 'The limbs glow amber as muscle effort builds, and cardiac output rises to match.' },
  skin: { title: 'Skin', sys: 'thermo', ch: 'temp', facts: [
    'The skin is the body\u2019s radiator. A network of blood vessels beneath it can carry very little blood or a great deal, which changes how much heat reaches the surface.',
    'Millions of eccrine sweat glands release sweat that cools the body as it evaporates. Sympathetic nerves control them.',
    'The hypothalamus controls both skin blood flow and sweating to hold core temperature steady.'],
    link: 'Blue drops appear when sweating starts, and the warm halo grows as core temperature rises.' }
};

/* ---------- glossary ---------- */
SYS.gen = { name: 'General principle', v: '--ink' };
const GL = [
  ['Adrenaline (epinephrine)', 'nervous', 'A hormone released by the adrenal glands during stress. It speeds the heart, strengthens each beat and widens the airways.', 'stress'],
  ['Alveoli', 'resp', 'Tiny air sacs at the ends of the airways where oxygen enters the blood and carbon dioxide leaves it.'],
  ['Baroreceptor', 'nervous', 'A stretch sensor in the wall of the carotid sinus and aortic arch. It detects blood pressure and reports it to the brainstem.', 'stand'],
  ['Baroreflex', 'nervous', 'The fast feedback loop that keeps blood pressure steady. Baroreceptors detect a change and the brainstem adjusts heart rate and vessel tone to correct it.', 'stand'],
  ['Bradycardia', 'cardio', 'A resting heart rate below 60 beats per minute. It is normal in trained athletes and during sleep, but can signal a problem in other people.'],
  ['Cardiac output', 'cardio', 'The volume of blood the heart pumps each minute: heart rate multiplied by stroke volume. It is about 5 litres per minute at rest.', 'exercise'],
  ['Cardiovascular drift', 'cardio', 'A slow rise in heart rate and fall in stroke volume during long exercise, often in the heat, as sweat reduces blood volume.', 'heat'],
  ['Central command', 'nervous', 'Signals from the motor areas of the brain that raise heart rate and breathing at the start of exercise, before the muscles need more oxygen.', 'exercise'],
  ['Chemoreceptor', 'resp', 'A sensor that detects chemicals in the blood. The carotid bodies sense low oxygen and the medulla senses high CO\u2082, and both increase breathing.', 'hold'],
  ['Compensated shock', 'cardio', 'Early circulatory failure, such as after blood loss, in which reflexes keep blood pressure near normal even though blood flow is already threatened.', 'bleed'],
  ['Contractility', 'cardio', 'How forcefully the heart muscle squeezes at a given filling. Sympathetic nerves and adrenaline increase it.'],
  ['Dehydration', 'fluid', 'A loss of body water that exceeds intake. It lowers blood volume, which makes the heart work harder.', 'heat'],
  ['Diastolic pressure', 'cardio', 'The lowest pressure in the arteries, reached while the heart relaxes and refills between beats.'],
  ['Diving reflex', 'resp', 'A reflex set off by breath-holding, and strongest with cold water on the face. It slows the heart and narrows vessels to conserve oxygen.', 'hold'],
  ['Fever', 'thermo', 'A rise in body temperature caused by a raised hypothalamic set point, usually in response to infection. It differs from overheating, where the set point is unchanged.', 'fever'],
  ['Frank\u2013Starling mechanism', 'cardio', 'Within limits, the heart pumps out more blood when it is filled with more. Stroke volume therefore follows venous return.', 'bleed'],
  ['Hemoglobin', 'resp', 'The iron-containing protein in red blood cells that carries oxygen.'],
  ['Homeostasis', 'gen', 'The body\u2019s ability to keep conditions such as temperature, blood pressure and blood chemistry within a narrow range.'],
  ['Hypercapnia', 'resp', 'Too much CO\u2082 in the blood. It is the main trigger of the urge to breathe.', 'hold'],
  ['Hypothalamus', 'thermo', 'A region at the base of the brain that acts as the body\u2019s thermostat and links the nervous system to hormones.', 'fever'],
  ['Hypothermia', 'thermo', 'A core body temperature below about 35 \u00B0C, which happens when heat loss outpaces heat production.', 'cold'],
  ['Hypoxia', 'resp', 'Too little oxygen reaching the tissues.'],
  ['Mean arterial pressure (MAP)', 'cardio', 'The average pressure in the arteries over a heartbeat, roughly cardiac output multiplied by resistance. It drives blood flow to the organs.'],
  ['Negative feedback', 'gen', 'A control loop in which a change triggers a response that opposes it, bringing the body back toward its set point.', 'stand'],
  ['Orthostatic hypotension', 'cardio', 'A fall in blood pressure on standing, causing dizziness. It is more common in older adults and when dehydrated.', 'stand'],
  ['Oxygen saturation (SpO\u2082)', 'resp', 'The percentage of hemoglobin that is carrying oxygen. Normal is about 95 to 100%.'],
  ['Parasympathetic nervous system', 'nervous', 'The \u201Crest-and-digest\u201D branch of the autonomic nervous system. Through the vagus nerve it slows the heart.', 'stress'],
  ['Partial pressure (PO\u2082, PCO\u2082)', 'resp', 'The pressure exerted by one gas in a mixture, measured in mmHg. It determines how much of the gas dissolves in blood and how strongly it diffuses.'],
  ['Peripheral resistance', 'cardio', 'The resistance to blood flow in the small arteries and arterioles. Narrower vessels raise it and wider ones lower it.'],
  ['Plasma volume', 'fluid', 'The watery part of the blood. It falls with sweating and blood loss.', 'heat'],
  ['Preload', 'cardio', 'The stretch of the heart muscle just before it contracts, set mainly by how much blood returns to the heart.', 'bleed'],
  ['Pulse pressure', 'cardio', 'The difference between systolic and diastolic pressure. It reflects stroke volume and how stiff the arteries are.', 'stand'],
  ['Pyrogen', 'thermo', 'A substance, such as an immune signal released during infection, that raises the hypothalamic set point and causes fever.'],
  ['Set point', 'gen', 'The target value a control system tries to hold, such as 37 \u00B0C for core temperature.', 'fever'],
  ['Sinoatrial (SA) node', 'cardio', 'The heart\u2019s natural pacemaker, a cluster of cells in the right atrium that starts each heartbeat.'],
  ['Stroke volume', 'cardio', 'The volume of blood pumped by one ventricle in a single beat, about 70 to 80 mL at rest.'],
  ['Sympathetic nervous system', 'nervous', 'The \u201Cfight-or-flight\u201D branch of the autonomic nervous system. It speeds the heart, narrows most blood vessels and prepares the body for action.', 'stress'],
  ['Systolic pressure', 'cardio', 'The highest pressure in the arteries, reached as the ventricles contract.'],
  ['Tachycardia', 'cardio', 'A resting heart rate above 100 beats per minute.'],
  ['Thermoregulation', 'thermo', 'The control of body temperature using skin blood flow, sweating and shivering.', 'heat'],
  ['Vagus nerve', 'nervous', 'The tenth cranial nerve and the main parasympathetic nerve. It slows the heart and supports digestion.'],
  ['Vasoconstriction', 'cardio', 'The narrowing of blood vessels, which raises resistance and pressure and reduces blood flow to the affected area.', 'cold'],
  ['Vasodilation', 'cardio', 'The widening of blood vessels, which lowers resistance and increases blood flow.', 'exercise'],
  ['Venous return', 'cardio', 'The flow of blood back to the heart through the veins. It sets how full the heart gets before each beat.', 'stand'],
  ['Ventilation', 'resp', 'The movement of air in and out of the lungs, usually measured as litres of air per minute.']
];
const GLD = Object.fromEntries(GL.map(g => [g[0], g[2]]));
function buildGlossary() {
  const list = GL.slice().sort((a, b) => a[0].localeCompare(b[0]));
  $('#gList').innerHTML = list.map(g => '<article class="gterm" data-q="' + (g[0] + ' ' + g[2]).toLowerCase().replace(/"/g, '') + '" style="--c:var(' + SYS[g[1]].v + ')"><h3>' + g[0] + '</h3><span class="pill">' + SYS[g[1]].name + '</span><p>' + g[2] + '</p>' + (g[3] ? '<button class="btn" data-act="sc" data-id="' + g[3] + '">See it: ' + SCD[g[3]].name + '</button>' : '') + '</article>').join('');
  $('#gCount').textContent = list.length + ' terms';
}

/* ---------- learning goals, worksheets ---------- */
const GOALS = {
  stand: 'Venous pooling, the baroreflex, why pulse pressure narrows, and why older adults are prone to dizziness on standing.',
  bleed: 'Compensated shock, the Frank\u2013Starling mechanism, and why a normal blood pressure can hide serious loss.',
  hold: 'CO\u2082 as the main driver of breathing, the oxygen\u2013hemoglobin curve, and the diving reflex.',
  stress: 'The sympathetic\u2013adrenal response and the parasympathetic rebound.',
  fever: 'The hypothalamic set point, skin vasoconstriction, shivering, and sweating when the fever breaks.',
  cold: 'Heat conservation and production, and how hypothermia begins.',
  heat: 'Sweating, plasma volume, and cardiovascular drift.',
  exercise: 'Central command, cardiac output, muscle blood flow and heat production.'
};
const VOCAB = {
  stand: ['Baroreflex', 'Venous return', 'Orthostatic hypotension', 'Pulse pressure', 'Vasoconstriction'],
  bleed: ['Preload', 'Compensated shock', 'Stroke volume', 'Tachycardia', 'Peripheral resistance'],
  hold: ['Chemoreceptor', 'Hypercapnia', 'Diving reflex', 'Oxygen saturation (SpO\u2082)', 'Hemoglobin'],
  stress: ['Sympathetic nervous system', 'Adrenaline (epinephrine)', 'Parasympathetic nervous system', 'Vagus nerve', 'Negative feedback'],
  fever: ['Hypothalamus', 'Set point', 'Pyrogen', 'Fever', 'Thermoregulation'],
  cold: ['Vasoconstriction', 'Hypothalamus', 'Thermoregulation', 'Hypothermia', 'Set point'],
  heat: ['Thermoregulation', 'Dehydration', 'Plasma volume', 'Cardiovascular drift', 'Vasodilation'],
  exercise: ['Central command', 'Cardiac output', 'Contractility', 'Vasodilation', 'Venous return']
};
function sheetHTML(id, key) {
  const res = getRes(id, 600, 'adult'), sc = SCD[id], dur = res.duration, s0 = res.series[0];
  const evs = buildEvents(id, res).filter(e => e.t > 0);
  const vars = [['hr', 'Heart rate', 'bpm', 0], ['bp', 'Blood pressure', 'mmHg', 0], ['rr', 'Breathing rate', 'per min', 0], ['spo2', 'Blood oxygen', '%', 1], ['temp', 'Body temperature', '\u00B0C', 1], ['bv', 'Blood volume', 'L', 2]];
  const box = (on) => key && on ? '\u2612' : '\u2610';
  let h = '<h1>Physyra \u00B7 ' + (key ? 'Answer key' : 'Student worksheet') + '</h1><p class="meta">Name: ______________________ &nbsp;&nbsp; Date: ______________ &nbsp;&nbsp; Class: ____________</p>';
  h += '<h2>' + sc.name + '</h2><p><em>' + sc.q + '</em></p><p class="meta">Body type: typical adult. Run time: ' + fmtT(dur, dur) + '. Goals: ' + GOALS[id] + '</p>';
  h += '<h3>Part 1. Predict (before you press play)</h3><p>For each measurement, decide what happens at its biggest change during the scenario, and say why.</p><table><tr><th>Measurement</th><th>Up</th><th>Down</th><th>No change</th><th>Because\u2026</th></tr>';
  vars.forEach(v => {
    const k = KEY[v[0]] || v[0]; let best = 0, bi = 0;
    res.series.forEach((s, i) => { const d = s[k] - s0[k]; if (Math.abs(d) > Math.abs(best)) { best = d; bi = i; } });
    const none = Math.abs(best) < THR[v[0]], up = !none && best > 0, down = !none && best < 0, pk = res.series[bi];
    const pv = v[0] === 'bp' ? Math.round(pk.sbp) + '/' + Math.round(pk.dbp) : pk[v[0]].toFixed(v[3]);
    const why = key ? (none ? 'Stays near its resting value.' : (up ? CHD[v[0]].txt.up : CHD[v[0]].txt.down) + ' (peak ' + pv + ' ' + v[2] + ')') : '';
    h += '<tr><td><b>' + v[1] + '</b></td><td class="c">' + box(up) + '</td><td class="c">' + box(down) + '</td><td class="c">' + box(none) + '</td><td class="w">' + why + '</td></tr>';
  });
  h += '</table>';
  h += '<h3>Part 2. Observe (press play, then pause at each step)</h3><table><tr><th>Time</th><th>Step</th><th>Heart rate</th><th>Blood pressure</th><th>Breathing</th><th>Blood O\u2082</th><th>Temp</th></tr>';
  const rows = [{ t: 0, title: 'Start (resting)' }].concat(evs);
  rows.forEach(e => {
    const v = valsAt(res, e.t), f = key;
    h += '<tr><td>' + fmtT(e.t, dur) + '</td><td>' + e.title + '</td><td>' + (f ? Math.round(v.hr) : '') + '</td><td>' + (f ? Math.round(v.sbp) + '/' + Math.round(v.dbp) : '') + '</td><td>' + (f ? Math.round(v.rr) : '') + '</td><td>' + (f ? v.spo2.toFixed(1) : '') + '</td><td>' + (f ? v.temp.toFixed(1) : '') + '</td></tr>';
  });
  h += '</table>';
  const L = LOOP[id] || [];
  h += '<h3>Part 3. Explain</h3><ol class="q"><li>Which measurement changed first, and which body system caused it?' + (key ? '<div class="ans">Sequence in the model: ' + evs.map(e => e.title).join(' \u2192 ') + '.</div>' : '<div class="line"></div><div class="line"></div>') + '</li>' +
    '<li>Describe the control loop in this scenario (stimulus, sensor, control centre, effector, response).' + (key ? '<div class="ans">' + L.map((s, i) => LOOPN[i] + ': ' + s.text).join('. ') + '.</div>' : '<div class="line"></div><div class="line"></div><div class="line"></div>') + '</li>' +
    '<li>What would happen if one step of this response failed?' + (key ? '<div class="ans">Answers vary. Look for a clear link between the failed step and a measurement that stays far from its resting value.</div>' : '<div class="line"></div><div class="line"></div>') + '</li></ol>';
  h += '<h3>Part 4. Vocabulary</h3><table><tr><th style="width:28%">Term</th><th>Definition in your own words</th></tr>' + VOCAB[id].map(t => '<tr><td><b>' + t + '</b></td><td class="w">' + (key ? GLD[t] : '') + '</td></tr>').join('') + '</table>';
  h += '<p class="foot2">Created with Physyra (physyra.netlify.app). Simulated values are illustrative and are not clinical data. \u201CThe human body is complex \u2014 learning how it works shouldn\u2019t have to be.\u201D Shakir Khan, Creator &amp; Developer.</p>';
  return h;
}
function printSheet(id, key) {
  $('#sheet').innerHTML = sheetHTML(id, key);
  document.body.classList.add('print-sheet');
  window.addEventListener('afterprint', () => document.body.classList.remove('print-sheet'), { once: true });
  setTimeout(() => window.print(), 60);
}
const PROF_ROWS = () => Object.keys(PROFILES).map(k => { const p = PROFILES[k]; return '<tr><td>' + p.name + '</td><td>' + p.hr0 + '</td><td>' + Math.round(75 * p.contr) + ' mL</td><td>' + p.baro.toFixed(2) + '\u00D7</td><td>' + Math.round(p.hr0 + 105 * p.symMax) + '</td><td>' + p.pp.toFixed(2) + '\u00D7</td><td>' + p.pool.toFixed(2) + '\u00D7</td></tr>'; }).join('');

/* ---------- challenges ---------- */
const CHAL = [
  { id: 'c1', sc: 'stand', title: 'Standing up', type: 'first', after: 1, opts: ['hr', 'co', 'width', 'rr'],
    q: 'You stand up after lying down. Which of these changes first?',
    why: 'Cardiac output falls first because gravity acts on blood immediately. The nervous system can only react once the pressure sensors notice the drop, so the heart rate and vessel changes come later. Breathing barely changes.' },
  { id: 'c2', sc: 'exercise', title: 'Starting to run', type: 'first', after: 20, opts: ['temp', 'spo2', 'hr', 'co'],
    q: 'You start running. Which of these changes first?',
    why: 'Heart rate leaps first, driven by the brain before the muscles need anything. Cardiac output follows a moment later as stroke volume rises. Temperature takes minutes, and blood oxygen stays almost unchanged.' },
  { id: 'c3', sc: 'hold', title: 'Breath-hold', type: 'mc',
    q: 'While you hold your breath, which change creates the urge to breathe?',
    opts: [['Blood oxygen falling', false], ['Blood CO\u2082 rising', true], ['Blood pressure rising', false], ['Heart rate slowing', false]],
    why: 'CO\u2082 is the main trigger. Blood oxygen stays high for a long time because of the oxygen already in your lungs and the flat top of the saturation curve, so the urge to breathe arrives well before oxygen runs low.' },
  { id: 'c4', sc: 'fever', title: 'Fever begins', type: 'first', after: 600, opts: ['temp', 'width', 'bv', 'spo2'],
    q: 'A fever starts as the brain raises its temperature set point. Which of these changes first?',
    why: 'Skin vessels narrow almost at once, because the body now thinks it is too cold and conserves heat. Temperature then climbs over many minutes. Blood volume and oxygen are not affected.' },
  { id: 'c5', sc: 'bleed', title: 'Losing blood', type: 'mc',
    q: 'You lose about a litre of blood, yet your blood pressure stays close to normal. Why?',
    opts: [['The heart speeds up and vessels tighten to compensate', true], ['The body replaces the blood within seconds', false], ['Blood pressure sensors stop working', false], ['Less blood has no effect on pressure', false]],
    why: 'The nervous system raises heart rate and squeezes the vessels, which holds pressure up even as volume falls. This compensation can hide serious blood loss until the reserve runs out.' }
];

/* ---------- explore controls ---------- */
const CTL = [
  { grp: 'cardio', items: [
    { k: 'stand', type: 'tog', label: 'Standing up' },
    { k: 'bleed', label: 'Blood lost', min: 0, max: 0.3, step: 0.01, fmt: v => Math.round(v * 5000) + ' mL' },
    { k: 'contr', label: 'Heart pump strength', min: 0.4, max: 1.2, step: 0.05, fmt: v => Math.round(v * 100) + '%' },
    { k: 'vessel', label: 'Vessel diameter', min: -1, max: 1, step: 0.05, fmt: v => v === 0 ? 'normal' : (v > 0 ? 'wider ' : 'narrower ') + Math.round(Math.abs(v) * 100) + '%' },
    { k: 'hrOn', type: 'tog', label: 'Force heart rate', slider: { k: 'hrVal', min: 40, max: 180, step: 5, fmt: v => v + ' bpm' } }
  ] },
  { grp: 'resp', items: [
    { k: 'hold', type: 'tog', label: 'Hold breath' },
    { k: 'fio2', label: 'Oxygen in the air', min: 0.1, max: 0.21, step: 0.005, fmt: v => (v * 100).toFixed(1) + '%' },
    { k: 'rrOn', type: 'tog', label: 'Force breathing rate', slider: { k: 'rrVal', min: 4, max: 40, step: 1, fmt: v => v + ' /min' } }
  ] },
  { grp: 'nervous', items: [
    { k: 'stress', label: 'Calm \u2194 stressed', min: -0.5, max: 1, step: 0.05, fmt: v => v === 0 ? 'neutral' : (v > 0 ? 'stress ' : 'calm ') + Math.round(Math.abs(v) * 100) + '%' }
  ] },
  { grp: 'thermo', items: [
    { k: 'heat', label: 'Environment (cold \u2194 hot)', min: -1, max: 1, step: 0.05, fmt: v => v === 0 ? 'comfortable' : (v > 0 ? 'hot ' : 'cold ') + Math.round(Math.abs(v) * 100) + '%' },
    { k: 'fever', label: 'Fever set point', min: 0, max: 3, step: 0.1, fmt: v => (37 + v).toFixed(1) + ' \u00B0C' }
  ] },
  { grp: 'fluid', items: [
    { k: 'exert', label: 'Exercise intensity', min: 0, max: 1, step: 0.05, fmt: v => Math.round(v * 100) + '%' },
    { k: 'fluid', label: 'Fluid lost', min: 0, max: 3, step: 0.25, fmt: v => v.toFixed(2) + ' L' }
  ] }
];
const EX0 = { exert: 0, stress: 0, stand: false, hold: false, bleed: 0, fluid: 0, heat: 0, fever: 0, fio2: 0.21, contr: 1, vessel: 0, hrOn: false, hrVal: 90, rrOn: false, rrVal: 22 };
const PRESETS = [
  { name: 'What if cardiac output decreases?', set: { contr: 0.5 }, hint: 'Pump strength is halved. Watch blood pressure, the tone of the vessels, and how hard the nervous system has to work.' },
  { name: 'What if breathing speeds up but there is less oxygen?', set: { rrOn: true, rrVal: 30, fio2: 0.14 }, hint: 'Breathing is forced to 30 per minute while the air holds 14% oxygen, like a high mountain. Watch CO\u2082 and oxygen move in different directions.' },
  { name: 'What if blood vessels widen?', set: { vessel: 0.8 }, hint: 'Vessel diameter is widened. Watch what happens to pressure and what the heart does to compensate.' },
  { name: 'What if you exercise while dehydrated?', set: { exert: 0.6, fluid: 2, heat: 0.5 }, hint: 'Hard exercise on a hot day after losing two litres of fluid. Compare heart rate and temperature with the plain Exercise scenario.' },
  { name: 'What if you lose a litre of fluid?', set: { fluid: 1, heat: 0.4, exert: 0.2 }, hint: 'A litre of fluid is lost on a warm day with light activity. Watch blood volume, heart rate and cardiac output.' }
];

/* ================= state ================= */
const A = { norm: true, mode: 'scenarios', prof: 'adult', cmp: '', part: '', res2: null, loopT: [], cs: null, caseNo: 0, caseScore: { r: 0, t: 0 }, level: 'basic', sc: 'stand', t: 0, playing: false, speed: 1, sel: 'hr',
  res: null, events: [], chal: null, done: {}, ex: Object.assign({}, EX0), exSpeed: 5, exHint: '', exSim: 0 };
const cache = {};
function getRes(id, N, prof) { prof = prof || A.prof; const k = id + ':' + (N || 600) + ':' + prof; return cache[k] || (cache[k] = runScenario(id, N || 600, prof)); }

function detect(res, e) {
  if (e.at != null) return e.at;
  if (!res) return null;
  const k = KEY[e.ch] || e.ch, ai = Math.round(e.after / res.sampleDt), b = res.series[ai][k];
  for (let i = ai; i <= res.N; i++) if ((res.series[i][k] - b) * e.dir >= e.d) return i * res.sampleDt;
  return null;
}
function buildEvents(id, res) {
  const out = [];
  EV[id].forEach(e => { const t = detect(res, e); if (t != null) out.push({ t, sys: e.sys, title: e.title, basic: e.basic, mech: e.mech }); });
  out.sort((a, b) => a.t - b.t);
  return out;
}

/* explore sim */
let S = null, BASE0 = null, hist = [], histAcc = 0;
function exploreReset(keepControls) {
  S = newState();
  for (let i = 0; i < 240; i++) step(S, {}, 0.25);
  BASE0 = snapshot(S);
  hist = []; histAcc = 0; A.exSim = 0;
  if (!keepControls) A.ex = Object.assign({}, EX0);
}
function exInp() {
  const e = A.ex;
  return { exert: e.exert, stress: e.stress, stand: e.stand, hold: e.hold, bleed: e.bleed, fluid: e.fluid, heat: e.heat, fever: e.fever,
    fio2: e.fio2, contr: e.contr, vessel: e.vessel, hrOver: e.hrOn ? e.hrVal : 0, rrOver: e.rrOn ? e.rrVal : 0 };
}
function exploreTick(dt) {
  let rem = dt * A.exSpeed; const inp = exInp();
  A.exSim += rem;
  while (rem > 1e-6) { const h = Math.min(0.25, rem); step(S, inp, h); rem -= h; }
  histAcc += dt;
  if (hist.length === 0 || histAcc >= 0.5) { histAcc = 0; hist.push(snapshot(S)); if (hist.length > 240) hist.shift(); }
}

/* ================= helpers ================= */
const D = () => A.res ? A.res.duration : 1;
function fmtT(t, dur) {
  dur = dur == null ? D() : dur;
  if (dur <= 120) return t.toFixed(1) + ' s';
  if (dur <= 1200) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60); return h + 'h ' + String(m).padStart(2, '0') + 'm';
}
function fmtAxis(t, dur) {
  if (dur <= 120) return Math.round(t) + 's';
  if (dur <= 1200) return Math.round(t / 60 * 10) / 10 + 'm';
  return Math.round(t / 360) / 10 + 'h';
}
function valsAt(res, t) {
  const x = clamp(t / res.sampleDt, 0, res.N), i = Math.floor(x), f = x - i, a = res.series[i], b = res.series[Math.min(res.N, i + 1)];
  const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * f; return o;
}
function curVals() { return A.mode === 'explore' ? snapshot(S) : (A.mode === 'cases' && A.cs) ? A.cs.vals : valsAt(A.res, A.t); }
function baseVals() { return A.mode === 'explore' ? BASE0 : A.res.series[0]; }
function fmtVal(c, v) { return c.id === 'bp' ? Math.round(v.sbp) + '/' + Math.round(v.dbp) : v[c.id].toFixed(c.dec); }
function trend(c, t) {
  if (A.mode === 'explore') {
    const n = hist.length; if (n < 6) return 'flat';
    const k = KEY[c.id] || c.id, d = hist[n - 1][k] - hist[Math.max(0, n - 12)][k]; const thr = THR[c.id] * 0.6;
    return d > thr ? 'up' : d < -thr ? 'down' : 'flat';
  }
  const w = Math.max(D() * 0.06, A.res.sampleDt * 3), k = KEY[c.id] || c.id;
  const a = valsAt(A.res, Math.max(0, t - w))[k], b = valsAt(A.res, t)[k], thr = THR[c.id] * 0.6;
  return b - a > thr ? 'up' : b - a < -thr ? 'down' : 'flat';
}

/* ================= theme colours for canvas ================= */
let T = {};
function readTheme() {
  const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
  T = { ink: g('--ink'), ink2: g('--ink2'), rule: g('--rule'), rule2: g('--rule2'), panel: g('--panel'), paper: g('--paper') };
  for (const k in SYS) T[k] = g(SYS[k].v);
}

/* ================= DOM build ================= */
const chRows = {};
function buildChannels() {
  const host = $('#channels'); host.innerHTML = '';
  CH.forEach(c => {
    const row = document.createElement('div'); row.className = 'row'; row.dataset.ch = c.id; row.style.setProperty('--c', 'var(' + SYS[c.sys].v + ')');
    row.innerHTML = '<button class="tile" data-act="sel" data-id="' + c.id + '" aria-label="Explain ' + c.label + '"><span class="lbl"><span>' + c.label + '</span><span class="flag"></span></span><span class="val"><span class="n"></span><small>' + c.unit + '</small></span><span class="dl"></span><span class="cmp"></span></button><canvas role="img" aria-label="' + c.label + ' over time"></canvas>';
    host.appendChild(row);
    chRows[c.id] = { row, n: $('.n', row), dl: $('.dl', row), cmp: $('.cmp', row), flag: $('.flag', row), lastf: '', lastc: '', cv: $('canvas', row), last: '', lastd: '' };
    bindScrub(chRows[c.id].cv);
  });
  fitAll();
}
function fitCanvas(cv) {
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  cv._w = w; cv._h = h; cv._d = dpr;
}
function fitAll() { for (const id in chRows) fitCanvas(chRows[id].cv); fitCanvas($('#timeline')); dirty = true; }

/* ================= drawing ================= */
function rangeFor(c, res) {
  if (A.mode === 'explore') return c.dom;
  const k = c.id === 'bp' ? ['sbp', 'dbp'] : [c.id]; let lo = Infinity, hi = -Infinity;
  const arrs = [res.series]; if (A.res2 && A.mode === 'scenarios') arrs.push(A.res2.series);
  arrs.forEach(sr => sr.forEach(s => k.forEach(kk => { if (s[kk] < lo) lo = s[kk]; if (s[kk] > hi) hi = s[kk]; })));
  const span = Math.max(hi - lo, c.span), mid = (hi + lo) / 2; lo = mid - span / 2; hi = mid + span / 2;
  const pad = (hi - lo) * 0.12; return [lo - pad, hi + pad];
}
const rangeCache = {};
function drawChart(c, tIdx) {
  const R = chRows[c.id], cv = R.cv, ctx = cv.getContext('2d'), W = cv._w, H = cv._h;
  ctx.setTransform(cv._d, 0, 0, cv._d, 0, 0); ctx.clearRect(0, 0, W, H);
  const explore = A.mode === 'explore';
  const series = explore ? hist : A.res.series, n = explore ? 239 : A.res.N, len = series.length;
  if (!len) return;
  const rk = explore ? 'ex' : A.sc; const key = rk + A.prof + A.cmp + c.id;
  const [lo, hi] = explore ? c.dom : (rangeCache[key] || (rangeCache[key] = rangeFor(c, A.res)));
  const padY = 5, X = i => ((explore ? (n - (len - 1)) : 0) + i) / n * W, Y = v => H - padY - (v - lo) / (hi - lo) * (H - 2 * padY);
  const col = T[c.sys], ghost = !explore && A.revealGhost;
  const kk = c.id === 'bp' ? 'map' : c.id, base = (explore ? BASE0 : series[0])[kk];
  if (A.norm && c.norm) {
    const nr = normRange(c), y1 = clamp(Y(nr[1]), 0, H), y2 = clamp(Y(nr[0]), 0, H);
    if (y2 - y1 > 1) { ctx.globalAlpha = 0.11; ctx.fillStyle = col; ctx.fillRect(0, y1, W, y2 - y1); ctx.globalAlpha = 1; }
  }
  // baseline
  ctx.strokeStyle = T.rule2; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(0, Y(base)); ctx.lineTo(W, Y(base)); ctx.stroke(); ctx.setLineDash([]);
  const last = explore ? len - 1 : tIdx;
  const path = (key2, upTo) => { ctx.beginPath(); const m = Math.floor(upTo); for (let i = 0; i <= m; i++) { const x = X(i), y = Y(series[i][key2]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    if (upTo > m && m < len - 1) { const f = upTo - m, v = series[m][key2] + (series[m + 1][key2] - series[m][key2]) * f; ctx.lineTo(X(upTo), Y(v)); } };
  if (ghost) {
    ctx.globalAlpha = 0.22; ctx.strokeStyle = col; ctx.lineWidth = 2;
    path(kk, len - 1); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (!explore && A.res2 && A.mode === 'scenarios') {
    const s2 = A.res2.series, ks = c.id === 'bp' ? ['sbp', 'dbp'] : [c.id];
    ks.forEach(k2 => {
      const p2 = upTo => { ctx.beginPath(); const m = Math.floor(upTo); for (let i = 0; i <= m; i++) { const x = X(i), y = Y(s2[i][k2]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } };
      ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.globalAlpha = 0.13; p2(len - 1); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]); p2(last); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
  }
  if (!explore && !A.revealGhost && A.mode === 'challenge' && !A.chalRun) return;
  if (c.id === 'bp') {
    const m = Math.floor(last); ctx.beginPath();
    for (let i = 0; i <= m; i++) { const x = X(i), y = Y(series[i].sbp); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let i = m; i >= 0; i--) ctx.lineTo(X(i), Y(series[i].dbp));
    ctx.closePath(); ctx.globalAlpha = 0.2; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
    ['sbp', 'dbp'].forEach(q => { path(q, last); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke(); });
  } else { path(kk, last); ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke(); }
  // playhead
  const px = X(last); ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
  const cur = explore ? series[len - 1] : valsAt(A.res, A.t); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, Y(cur[kk]), 4, 0, 7); ctx.fill();
  ctx.strokeStyle = T.paper; ctx.lineWidth = 1.5; ctx.stroke();
}
function drawTimeline() {
  const cv = $('#timeline'), ctx = cv.getContext('2d'), W = cv._w, H = cv._h; ctx.setTransform(cv._d, 0, 0, cv._d, 0, 0); ctx.clearRect(0, 0, W, H);
  ctx.font = '12px ' + getComputedStyle(document.body).fontFamily; ctx.textBaseline = 'alphabetic';
  if (A.mode === 'explore') {
    ctx.fillStyle = T.ink2; ctx.textAlign = 'left'; ctx.fillText('older', 2, H - 6); ctx.textAlign = 'right'; ctx.fillText('now', W - 2, H - 6);
    ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, H - 18); ctx.lineTo(W, H - 18); ctx.stroke(); return;
  }
  const dur = D(), X = t => t / dur * W, ty = H - 18;
  ctx.strokeStyle = T.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
  const steps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600], want = W / 90; let st = steps.find(s => dur / s <= want) || 3600;
  ctx.fillStyle = T.ink2; ctx.textAlign = 'center';
  for (let t = 0; t <= dur + 1e-6; t += st) { const x = X(t); ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x, ty + 5); ctx.stroke(); ctx.textAlign = t === 0 ? 'left' : (t + st > dur ? 'right' : 'center'); ctx.fillText(fmtAxis(t, dur), x, H - 3); }
  if (!(A.mode === 'challenge' && !A.revealGhost)) A.events.forEach(e => {
    const x = X(e.t); ctx.fillStyle = T[e.sys]; ctx.strokeStyle = T.paper; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ty - 14); ctx.lineTo(x + 6, ty - 7); ctx.lineTo(x, ty); ctx.lineTo(x - 6, ty - 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  });
  const px = X(A.t); ctx.strokeStyle = T.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, ty + 2); ctx.stroke();
  ctx.fillStyle = T.ink; ctx.beginPath(); ctx.moveTo(px - 6, 0); ctx.lineTo(px + 6, 0); ctx.lineTo(px, 9); ctx.fill();
}

/* ================= body figure ================= */
const fig = {}; let heartPh = 0, breathPh = 0, flowOff = 0, nerveOff = 0, standSm = 0, drops = [];
function initFigure() {
  ['rig', 'aura', 'poolFill', 'muscle', 'brain', 'lungL', 'lungR', 'heart', 'vBase', 'vFlow', 'spine', 'dropsG'].forEach(i => fig[i] = $('#' + i));
  const g = fig.dropsG; const pts = [[118, 18], [142, 20], [130, 30], [100, 140], [160, 140], [70, 190], [190, 190], [115, 120]];
  pts.forEach((p, i) => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 2.6); c.setAttribute('cx', p[0]); c.setAttribute('fill', 'var(--fluid)'); g.appendChild(c); drops.push({ el: c, y: p[1], ph: i / pts.length }); });
}
function drawFigure(v, dt, ts) {
  const usePosture = A.mode === 'explore' || (A.mode !== 'cases' && A.sc === 'stand');
  let standNow = 1;
  if (usePosture) standNow = A.mode === 'explore' ? (A.ex.stand ? 1 : 0) : (A.t >= 1 ? 1 : 0);
  standSm += (standNow - standSm) * Math.min(1, dt / 0.35);
  const shiv = v.shiver > 0.2 && !RM ? v.shiver : 0;
  const jx = shiv ? Math.sin(ts * 0.09) * 1.6 * shiv : 0;
  const ang = usePosture ? -90 * (1 - standSm) : 0;
  fig.rig.setAttribute('transform', 'translate(' + jx.toFixed(2) + ' 0) rotate(' + ang.toFixed(1) + ' 130 280)');
  // heart
  heartPh = (heartPh + dt * v.hr / 60) % 1;
  const amp = RM ? 0.04 : 0.13, bump = heartPh < 0.22 ? Math.sin(Math.PI * heartPh / 0.22) : 0;
  const hs = 0.95 * (1 + amp * bump);
  fig.heart.setAttribute('transform', 'translate(124 176) scale(' + hs.toFixed(3) + ')');
  // lungs
  const held = v.rr < 0.5;
  $$('#fig [data-act="part"]').forEach(el => el.classList.toggle('hl', el.dataset.id === A.part));
  breathPh = (breathPh + dt * (held ? 0 : v.rr) / 60) % 1;
  const depth = 0.07 + 0.07 * clamp((v.rr - 14) / 25, 0, 1);
  const br = held ? 0.7 : 0.5 - 0.5 * Math.cos(2 * Math.PI * breathPh), sc = 1 + depth * br + (held ? 0.04 : 0);
  fig.lungL.setAttribute('transform', 'translate(102 168) scale(' + (1 + (sc - 1) * 0.8).toFixed(3) + ' ' + sc.toFixed(3) + ') translate(-102 -168)');
  fig.lungR.setAttribute('transform', 'translate(158 168) scale(' + (1 + (sc - 1) * 0.8).toFixed(3) + ' ' + sc.toFixed(3) + ') translate(-158 -168)');
  // brain perfusion, vessels, flow
  fig.brain.setAttribute('opacity', (0.18 + 0.82 * clamp(v.perf, 0, 1)).toFixed(2));
  const wdt = 5.2 * (v.width / 100);
  fig.vBase.setAttribute('stroke-width', wdt.toFixed(2)); fig.vFlow.setAttribute('stroke-width', Math.max(2, wdt * 0.55).toFixed(2));
  flowOff -= dt * v.co * (RM ? 3 : 14); fig.vFlow.setAttribute('stroke-dashoffset', flowOff.toFixed(1));
  // nerves
  const symN = clamp((v.sym - 10) / 80, 0, 1);
  nerveOff += dt * (RM ? 4 : 30 * symN + 4); fig.spine.setAttribute('stroke-dashoffset', nerveOff.toFixed(1));
  fig.spine.setAttribute('opacity', (0.18 + 0.82 * symN).toFixed(2));
  // pooling, muscle, heat, sweat
  const ph = 150 * clamp(v.pool, 0, 1); fig.poolFill.setAttribute('y', 500 - ph); fig.poolFill.setAttribute('height', ph);
  fig.muscle.setAttribute('opacity', (0.6 * clamp(v.eM / 0.75, 0, 1)).toFixed(2));
  fig.aura.setAttribute('opacity', (0.7 * clamp((v.temp - 37) / 2, 0, 1)).toFixed(2));
  const sw = clamp(v.sweat / 0.35, 0, 1);
  drops.forEach(d => { const f = (ts / 1000 * 0.7 + d.ph) % 1; d.el.setAttribute('cy', (d.y + f * 16).toFixed(1)); d.el.setAttribute('opacity', (sw * (1 - f)).toFixed(2)); });
}

/* ================= right panel + picker ================= */
function pill(sys) { return '<span class="pill" style="--c:var(' + SYS[sys].v + ')">' + SYS[sys].name + '</span>'; }
function renderPicker() {
  const host = $('#picker'); let h = '';
  if (A.mode === 'scenarios') {
    ['cardio', 'resp', 'nervous', 'thermo', 'fluid'].forEach(g => {
      const items = SCN.filter(s => s.group === g); if (!items.length) return;
      h += '<div class="group sgrp" style="--c:var(' + SYS[g].v + ')"><span class="glabel">' + SYS[g].name + '</span>' + items.map(s => '<button class="chip" data-act="sc" data-id="' + s.id + '" aria-pressed="' + (A.sc === s.id) + '">' + s.name + '</button>').join('') + '</div>';
    });
    h += '<label class="scSelWrap">Scenario <select id="scSel">' + SCN.map(s => '<option value="' + s.id + '"' + (A.sc === s.id ? ' selected' : '') + '>' + s.name + '</option>').join('') + '</select></label>';
  } else if (A.mode === 'challenge') {
    h += '<div class="group"><span class="glabel" style="color:var(--ink)">Predict the order</span>' + CHAL.map(c => '<button class="chip' + (A.done[c.id] ? ' done' : '') + '" data-act="chal" data-id="' + c.id + '" aria-pressed="' + (A.chal && A.chal.id === c.id) + '">' + c.title + '</button>').join('') + '</div>';
  } else {
    h += '<div class="group"><span class="glabel" style="color:var(--ink)">What if\u2026</span>' + PRESETS.map((p, i) => '<button class="chip" data-act="preset" data-id="' + i + '">' + p.name.replace('What if ', '').replace('?', '') + '</button>').join('') + '<button class="btn" data-act="reset">Reset body</button></div>';
    h += '<label>Body time per second <select id="exSpeed">' + [1, 5, 30, 120].map(s => '<option value="' + s + '"' + (A.exSpeed === s ? ' selected' : '') + '>' + s + '\u00D7</option>').join('') + '</select></label>';
  }
  const profOpts = Object.keys(PROFILES).map(k => '<option value="' + k + '"' + (A.prof === k ? ' selected' : '') + '>' + PROFILES[k].name + '</option>').join('');
  if (A.mode === 'scenarios' || A.mode === 'explore') h += '<label>Body type <select id="profSel">' + profOpts + '</select></label>';
  if (A.mode === 'scenarios') h += '<label>Compare with <select id="cmpSel"><option value="">Nobody</option>' + Object.keys(PROFILES).filter(k => k !== A.prof).map(k => '<option value="' + k + '"' + (A.cmp === k ? ' selected' : '') + '>' + PROFILES[k].name + '</option>').join('') + '</select></label>';
  if (A.mode === 'cases') h = '<div class="group"><span class="glabel" style="color:var(--ink)">Case file</span><span style="font-size:14px;color:var(--ink2)">Read the measurements, then decide what is happening. Score: ' + A.caseScore.r + ' of ' + A.caseScore.t + '</span></div>';
  host.innerHTML = h;
}
function chanCard() {
  const c = CHD[A.sel]; let tr = trend(c, A.t), word = tr === 'up' ? 'rising' : tr === 'down' ? 'falling' : 'steady', lead = '';
  if (tr === 'flat') {
    const kk = KEY[c.id] || c.id, dev = curVals()[kk] - baseVals()[kk];
    if (Math.abs(dev) >= THR[c.id]) { const up = dev > 0; word = up ? 'holding above rest' : 'holding below rest'; lead = up ? 'It has levelled off above its resting value. ' : 'It has levelled off below its resting value. '; tr = up ? 'up' : 'down'; }
  }
  const lnk = (arr) => arr.map(id => '<button data-act="sel" data-id="' + id + '" style="--c:var(' + SYS[CHD[id].sys].v + ')">' + CHD[id].label + '</button>').join('');
  return '<section style="--c:var(' + SYS[c.sys].v + ')"><h2>Why is this changing?</h2>' + pill(c.sys) +
    '<h3>' + c.label + ' is ' + word + '</h3><p>' + lead + c.txt[tr] + '</p>' +
    (A.level === 'mech' ? '<p class="mech"><b>How it works</b>' + c.mech + '</p>' : '') +
    (c.causes.length ? '<div class="links">Driven by ' + lnk(c.causes) + '</div>' : '') +
    (c.affects.length ? '<div class="links">Affects ' + lnk(c.affects) + '</div>' : '') + '</section>';
}
function anatCard() {
  const a = ANAT[A.part]; if (!a) return '';
  return '<section style="--c:var(' + SYS[a.sys].v + ')"><h2>Anatomy</h2>' + pill(a.sys) + '<h3>' + a.title + '</h3>' + a.facts.map(f => '<p>' + f + '</p>').join('') +
    '<p class="mech"><b>In Physyra</b>' + a.link + '</p><div class="links"><button data-act="sel" data-id="' + a.ch + '" style="--c:var(' + SYS[CHD[a.ch].sys].v + ')">Show ' + CHD[a.ch].label + '</button><button data-act="part" data-id="" style="--c:var(--ink)">Hide anatomy</button></div></section>';
}
const LOOPN = ['Stimulus', 'Sensor', 'Control centre', 'Effector', 'Response'];
function loopLit() { return A.loopT.filter(t => A.t >= t).length; }
function loopCard() {
  const L = LOOP[A.sc]; if (!L || !A.loopT.length) return '';
  return '<section><h2>Control loop</h2><ol class="loop">' + L.map((s, i) => '<li class="' + (A.t >= A.loopT[i] ? 'lit' : 'dim') + '"><b>' + LOOPN[i] + '</b><span>' + s.text + '</span></li>').join('') + '</ol></section>';
}
function caseCard() {
  const c = A.cs; if (!c) return '';
  let h = '<section><h2>Case ' + A.caseNo + '</h2><h3>What is happening to this person?</h3><p>These readings come from a typical adult. Use the measurements, and how long it has been since this started, to decide.</p><div class="q-opts" role="group" aria-label="Possible causes">';
  c.opts.forEach((k, i) => {
    let cls = '', dis = c.ans != null ? ' disabled' : '';
    if (c.ans != null) { if (k === c.sc) cls = 'ok'; else if (c.ans === i) cls = 'bad'; }
    h += '<button class="' + cls + '" data-act="canswer" data-id="' + i + '"' + dis + '><span>' + CASE[k].label + '</span><span>' + (cls === 'ok' ? '\u2713' : cls === 'bad' ? '\u2717' : '') + '</span></button>';
  });
  h += '</div>';
  if (c.ans != null) {
    const ok = c.opts[c.ans] === c.sc;
    h += '<div class="verdict">' + (ok ? 'Correct.' : 'Not quite.') + '</div><p><b>It was: ' + CASE[c.sc].label + '.</b> ' + CASE[c.sc].clues + '</p><div class="btnrow"><button class="btn" data-act="cnext">Next case</button><button class="btn" data-act="creplay">Replay it in Scenarios</button></div>';
  }
  return h + '</section>';
}
function curEventIdx() { let k = -1; A.events.forEach((e, i) => { if (e.t <= A.t + 1e-6) k = i; }); return k; }
function nowCard() {
  const k = curEventIdx(), e = A.events[k];
  if (!e) return '<section><h2>Press play</h2><p>Each step in the body\u2019s response will appear here as it happens.</p></section>';
  const nx = A.events[k + 1];
  return '<section style="--c:var(' + SYS[e.sys].v + ')"><h2>At ' + fmtT(e.t) + '</h2>' + pill(e.sys) + '<h3>' + e.title + '</h3><p>' + e.basic + '</p>' +
    (A.level === 'mech' ? '<p class="mech"><b>How it works</b>' + e.mech + '</p>' : '') +
    (nx ? '<div class="next">Next: ' + nx.title + ' at ' + fmtT(nx.t) + '</div>' : '<div class="next">That is the last step in this scenario.</div>') + '</section>';
}
function seqCard() {
  const k = curEventIdx();
  return '<section><h2>Sequence of events</h2><ol class="seq">' + A.events.map((e, i) => '<li class="' + (i === k ? 'cur ' : '') + (i <= k ? 'past' : 'future') + '" style="--c:var(' + SYS[e.sys].v + ')"><button data-act="jump" data-id="' + i + '"><span class="tm">' + fmtT(e.t) + '</span><span class="ti">' + e.title + '</span></button></li>').join('') + '</ol></section>';
}
function controlsCard() {
  let h = '<section><h2>Change the body</h2>' + (A.exHint ? '<p class="hint">' + A.exHint + '</p>' : '<p class="hint">Move a control and watch the effects ripple through the other systems.</p>') + '<div class="btnrow"><button class="btn" data-act="exlink">Copy link to this experiment</button><button class="btn" data-act="excsv">Export CSV</button></div></section><section>';
  CTL.forEach(g => {
    h += '<div class="ctl-group" style="--c:var(' + SYS[g.grp].v + ')"><h2>' + SYS[g.grp].name + '</h2>';
    g.items.forEach(it => {
      if (it.type === 'tog') {
        h += '<div class="ctl tog"><input type="checkbox" id="c_' + it.k + '" data-k="' + it.k + '"' + (A.ex[it.k] ? ' checked' : '') + '><label for="c_' + it.k + '">' + it.label + '</label></div>';
        if (it.slider) { const s = it.slider; h += '<div class="ctl"><label for="c_' + s.k + '" class="sr">' + it.label + ' value</label><output id="o_' + s.k + '">' + s.fmt(A.ex[s.k]) + '</output><input type="range" id="c_' + s.k + '" data-k="' + s.k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + A.ex[s.k] + '"></div>'; }
      } else {
        h += '<div class="ctl"><label for="c_' + it.k + '">' + it.label + '</label><output id="o_' + it.k + '">' + it.fmt(A.ex[it.k]) + '</output><input type="range" id="c_' + it.k + '" data-k="' + it.k + '" min="' + it.min + '" max="' + it.max + '" step="' + it.step + '" value="' + A.ex[it.k] + '"></div>';
      }
    });
    h += '</div>';
  });
  return h + '</section>';
}
function chalCard() {
  const c = A.chal; if (!c) return '<section><h2>Challenge mode</h2><h3>Predict, then watch</h3><p>Pick a challenge above. Make your prediction, then the simulation runs and shows what actually happens.</p></section>';
  const opts = c.type === 'first' ? c.opts.map(id => [CHD[id].label, id === c.correct, id]) : c.opts.map((o, i) => [o[0], o[1], i]);
  let h = '<section><h2>Your prediction</h2><h3>' + c.q + '</h3><div class="q-opts" role="group" aria-label="Answers">';
  opts.forEach((o, i) => {
    let cls = '', dis = A.chalAns != null ? ' disabled' : '';
    if (A.chalAns != null) { if (o[1]) cls = 'ok'; else if (A.chalAns === i) cls = 'bad'; }
    h += '<button class="' + cls + '" data-act="answer" data-id="' + i + '"' + dis + '><span>' + o[0] + '</span><span>' + (cls === 'ok' ? '\u2713' : cls === 'bad' ? '\u2717' : '') + '</span></button>';
  });
  h += '</div>';
  if (A.chalAns != null) {
    const right = opts[A.chalAns][1];
    h += '<div class="verdict">' + (right ? 'Correct.' : 'Not quite.') + '</div><p>' + c.why + '</p>';
    if (c.type === 'first' && A.chalOrder) h += '<h2>What the simulation did</h2><ol class="order">' + A.chalOrder.map(o => '<li><span>' + CHD[o.id].label + '</span><span class="tm">' + (isFinite(o.t) ? fmtT(o.t) : 'no real change') + '</span></li>').join('') + '</ol>';
  }
  return h + '</section>';
}
function renderRight() {
  const host = $('#explainBody'); let h = '';
  if (A.mode === 'scenarios') h = nowCard() + loopCard() + anatCard() + chanCard() + seqCard();
  else if (A.mode === 'explore') h = controlsCard() + anatCard() + chanCard();
  else if (A.mode === 'cases') h = caseCard();
  else h = chalCard() + (A.chalAns != null ? nowCard() + loopCard() + anatCard() + chanCard() + seqCard() : '');
  const st = host.scrollTop; host.innerHTML = h; host.scrollTop = st;
}
function renderHead() {
  let title, q;
  if (A.mode === 'scenarios') { const s = SCD[A.sc]; title = s.name; q = s.q; }
  else if (A.mode === 'explore') { title = 'Explore mode'; q = 'Change one thing and watch what the rest of the body does about it. This body is running live.'; }
  else if (A.mode === 'cases') { title = 'Case file'; q = 'Read the measurements and work out what is happening to this person.'; }
  else if (A.chal) { title = A.chal.title; q = 'Make a prediction, then watch the simulation.'; } else { title = 'Challenge mode'; q = 'Predict what the body does before you see it happen.'; }
  $('#scTitle').textContent = title; $('#scQ').textContent = q;
  $$('.seg [data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === A.mode));
  $$('.seg [data-level]').forEach(b => b.setAttribute('aria-pressed', b.dataset.level === A.level));
  $('#transport').style.display = A.mode === 'explore' ? 'none' : '';
  $('#stimH').textContent = A.mode === 'cases' ? 'Case notes' : 'What the body is dealing with';
}
function stimuli(inp, v) {
  const rows = [];
  if (A.mode === 'explore' || A.sc === 'stand') rows.push(['Posture', inp.stand ? 'Standing' : 'Lying down']);
  if (inp.exert > 0.02) rows.push(['Exercise', Math.round(inp.exert * 100) + '% effort']);
  if (inp.stress) rows.push(['Stress', inp.stress > 0 ? Math.round(inp.stress * 100) + '%' : 'Calm (rest-and-digest)']);
  if (inp.hold) rows.push(['Breathing', 'Held']);
  if (inp.bleed > 0.005) rows.push(['Blood lost', Math.round(inp.bleed * 5000) + ' mL']);
  if (inp.fluid > 0) rows.push(['Fluid lost', inp.fluid.toFixed(2) + ' L']);
  if (inp.heat > 0) rows.push(['Environment', 'Hot']);
  if (inp.heat < 0) rows.push(['Environment', 'Cold']);
  if (inp.fever > 0) rows.push(['Fever set point', (37 + inp.fever).toFixed(1) + ' \u00B0C']);
  if (inp.fio2 && inp.fio2 < 0.2) rows.push(['Oxygen in air', (inp.fio2 * 100).toFixed(1) + '%']);
  if (inp.contr != null && inp.contr !== 1) rows.push(['Pump strength', Math.round(inp.contr * 100) + '%']);
  if (inp.vessel) rows.push(['Vessel diameter', (inp.vessel > 0 ? 'wider' : 'narrower')]);
  if (inp.hrOver) rows.push(['Heart rate', 'forced to ' + inp.hrOver]);
  if (inp.rrOver) rows.push(['Breathing', 'forced to ' + inp.rrOver + '/min']);
  if (A.mode === 'explore' && A.exSim > 1) rows.push(['Body time', fmtT(A.exSim, 100000)]);
  if (!rows.length || (rows.length === 1 && rows[0][0] === 'Posture' && !inp.stand && A.sc !== 'stand')) rows.unshift(['Condition', 'At rest']);
  return rows;
}

/* ================= main render ================= */
let dirty = true, lastEvIdx = -2, lastTrend = '', stimKey = '', lastLoop = -1;
function render(ts, dt) {
  const v = curVals(), base = baseVals();
  // channels
  CH.forEach(c => {
    const R = chRows[c.id], s = fmtVal(c, v);
    if (R.last !== s) { R.n.textContent = s; R.last = s; }
    const kk = c.id === 'bp' ? 'map' : c.id, d = v[kk] - base[kk];
    const dd = Math.abs(d) < THR[c.id] * 0.4 ? '\u2248 rest' : (d > 0 ? '\u25B2 ' : '\u25BC ') + Math.abs(c.id === 'bp' ? d : d).toFixed(c.dec === 0 ? 0 : c.dec);
    if (R.lastd !== dd) { R.dl.textContent = dd; R.lastd = dd; R.dl.className = 'dl ' + (dd[0] === '\u25B2' ? 'up' : dd[0] === '\u25BC' ? 'down' : ''); }
    R.row.classList.toggle('sel', c.id === A.sel);
    const fl = A.norm ? normFlag(c, v) : '';
    if (R.lastf !== fl) { R.flag.textContent = fl === 'high' ? '\u25B2 high' : fl === 'low' ? '\u25BC low' : ''; R.lastf = fl; }
    const cm = (A.res2 && A.mode === 'scenarios') ? PROFILES[A.cmp].name.split(' (')[0] + ': ' + fmtVal(c, valsAt(A.res2, A.t)) : '';
    if (R.lastc !== cm) { R.cmp.textContent = cm; R.lastc = cm; }
  });
  const tIdx = A.mode === 'explore' ? 0 : A.t / A.res.sampleDt;
  if (A.mode !== 'cases') { CH.forEach(c => drawChart(c, tIdx)); drawTimeline(); }
  drawFigure(v, dt, ts);
  // clock
  if (A.mode === 'explore' || A.mode === 'cases') $('#clock').innerHTML = '';
  else $('#clock').innerHTML = fmtT(A.t) + ' <small>/ ' + fmtT(D()) + '</small>';
  // stimuli
  let inp;
  if (A.mode === 'explore') inp = exInp(); else inp = Object.assign({}, SCENARIOS[A.sc].inputs(A.t));
  const rows = A.mode === 'cases' ? [['Time since onset', A.cs ? fmtT(A.cs.t, A.cs.t <= 120 ? 100 : A.cs.t <= 1200 ? 600 : 20000) : '']] : stimuli(inp, v), key = JSON.stringify(rows);
  if (key !== stimKey) { stimKey = key; $('#stim').innerHTML = rows.map(r => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join(''); }
  // right panel refresh when event / trend changes
  if (A.mode !== 'explore') {
    const k = curEventIdx(), tr = trend(CHD[A.sel], A.t), lc = loopLit();
    if (k !== lastEvIdx || tr !== lastTrend || lc !== lastLoop) { if (k !== lastEvIdx && A.events[k] && (A.playing || A.t > 0)) $('#live').textContent = fmtT(A.events[k].t) + ': ' + A.events[k].title; lastEvIdx = k; lastTrend = tr; lastLoop = lc; renderRight(); }
  } else {
    const tr = trend(CHD[A.sel], 0); if (tr !== lastTrend) { lastTrend = tr; refreshChanCard(); }
  }
  // play icon
  const pb = $('#play'); if (pb) { const pl = A.playing; if (pb._p !== pl) { pb._p = pl; pb.innerHTML = pl ? '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>'; pb.setAttribute('aria-label', pl ? 'Pause' : 'Play'); } }
}
function refreshChanCard() {
  const host = $('#explainBody'), sections = $$('section', host);
  const tmp = document.createElement('div'); tmp.innerHTML = chanCard();
  const old = sections[sections.length - 1]; if (old && tmp.firstChild) old.replaceWith(tmp.firstChild);
}

/* ================= controls ================= */
function loadScenario(id, opts) {
  opts = opts || {};
  A.sc = id; A.res = getRes(id, opts.N); A.events = buildEvents(id, A.res);
  A.res2 = (A.cmp && A.mode === 'scenarios') ? getRes(id, opts.N, A.cmp) : null;
  A.loopT = (LOOP[id] || []).map(s => { const t = detect(A.res, s); return t == null ? Infinity : t; });
  $('#channels').classList.toggle('cmp-on', !!A.res2); lastLoop = -1;
  if (A.mode === 'scenarios') setHash(id);
  A.t = 0; A.playing = false; A.revealGhost = opts.ghost !== false; lastEvIdx = -2; lastTrend = ''; stimKey = '';
  A.chalRun = false;
  for (const k in rangeCache) delete rangeCache[k];
  renderHead(); renderPicker(); renderRight(); fitAll(); dirty = true;
}
function setHash(h) { try { history.replaceState(null, '', '#' + h); } catch (e) {} }
function newCase() {
  const keys = Object.keys(CASE).filter(k => !A.cs || k !== A.cs.sc);
  const sc = keys[Math.floor(Math.random() * keys.length)], r = CASE[sc].r, t = r[0] + Math.random() * (r[1] - r[0]);
  const vals = valsAt(getRes(sc, 600, 'adult'), t);
  const others = Object.keys(CASE).filter(k => k !== sc).sort(() => Math.random() - 0.5).slice(0, 3);
  A.cs = { sc, t, vals, opts: [sc].concat(others).sort(() => Math.random() - 0.5), ans: null }; A.caseNo++;
  stimKey = ''; renderHead(); renderPicker(); renderRight();
}
function setMode(m) {
  if (m === A.mode) return;
  if (m === 'about' || m === 'glossary') {
    A.mode = m; A.playing = false; const cl = document.body.classList; cl.remove('mode-cases', 'mode-about', 'mode-glossary'); cl.add('mode-' + m);
    setHash(m); renderHead(); window.scrollTo(0, 0); return;
  }
  document.body.classList.remove('mode-about', 'mode-glossary');
  A.mode = m; A.playing = false; lastEvIdx = -2; lastTrend = ''; stimKey = '';
  for (const k in rangeCache) delete rangeCache[k];
  $('#channels').classList.toggle('cases-on', m === 'cases'); document.body.classList.toggle('mode-cases', m === 'cases');
  if (m !== 'scenarios') { A.res2 = null; $('#channels').classList.remove('cmp-on'); setHash(m); }
  if (m === 'cases') { A.res = getRes('stand', 600, 'adult'); A.events = []; A.loopT = []; A.cs = null; newCase(); }
  else if (m === 'scenarios') loadScenario(A.sc);
  else if (m === 'explore') { if (!S) exploreReset(); A.exHint = ''; renderHead(); renderPicker(); renderRight(); }
  else { A.chal = null; A.chalAns = null; A.chalOrder = null; A.res = getRes('stand'); A.events = []; A.revealGhost = false; A.t = 0; renderHead(); renderPicker(); renderRight(); }
  fitAll();
}
function pickChallenge(id) {
  const c = CHAL.find(x => x.id === id); A.chal = c; A.chalAns = null; A.chalOrder = null;
  if (c.type === 'first') { const r = getRes(c.sc, Math.min(3000, Math.round(SCENARIOS[c.sc].duration * 4))); A.chalOrder = firstChanges(r, c.opts, c.after); c.correct = A.chalOrder[0].id; }
  loadScenario(c.sc); A.revealGhost = false; A.events = A.events; renderHead(); renderPicker(); renderRight(); dirty = true;
}
function answer(i) {
  const c = A.chal; if (!c || A.chalAns != null) return;
  A.chalAns = +i; const opts = c.type === 'first' ? c.opts.map(id => id === c.correct) : c.opts.map(o => o[1]);
  if (opts[A.chalAns]) A.done[c.id] = true;
  A.revealGhost = true; A.chalRun = true; A.t = 0; A.playing = true; lastEvIdx = -2; renderPicker(); renderRight();
}
function rate() { return D() / SCD[A.sc].playSecs * A.speed; }
function seek(t, pause) { A.t = clamp(t, 0, D()); if (pause) A.playing = false; dirty = true; }
function bindScrub(cv) {
  const move = e => { const r = cv.getBoundingClientRect(); if (A.mode === 'explore') return; A.t = clamp((e.clientX - r.left) / r.width, 0, 1) * D(); A.playing = false; };
  cv.addEventListener('pointerdown', e => { if (A.mode === 'challenge' && A.chalAns == null) return; cv.setPointerCapture(e.pointerId); cv._drag = true; move(e); });
  cv.addEventListener('pointermove', e => { if (cv._drag) move(e); });
  cv.addEventListener('pointerup', () => { cv._drag = false; });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  if (act === 'mode') setMode(b.dataset.mode);
  else if (act === 'level') { A.level = b.dataset.level; renderHead(); renderRight(); }
  else if (act === 'sc') { if (A.mode !== 'scenarios') { A.sc = id; setMode('scenarios'); } else loadScenario(id); }
  else if (act === 'chal') pickChallenge(id);
  else if (act === 'answer') answer(id);
  else if (act === 'sel') { A.sel = id; lastTrend = ''; if (A.mode === 'explore') refreshChanCard(); else renderRight(); }
  else if (act === 'play') { if (A.mode === 'challenge' && A.chalAns == null) return; if (A.t >= D() - 1e-6) A.t = 0; A.playing = !A.playing; }
  else if (act === 'restart') { A.t = 0; A.playing = false; }
  else if (act === 'prev' || act === 'next') {
    if (A.mode === 'challenge' && A.chalAns == null) return;
    const ts = A.events.map(x => x.t); let t = A.t;
    if (act === 'next') { const n = ts.find(x => x > t + 1e-6); t = n != null ? n : D(); } else { const p = ts.filter(x => x < t - 0.05); t = p.length ? p[p.length - 1] : 0; }
    seek(t, true);
  }
  else if (act === 'jump') { seek(A.events[+id].t, true); }
  else if (act === 'preset') { const p = PRESETS[+id]; exploreReset(false); Object.assign(A.ex, p.set); A.exHint = p.hint; renderRight(); }
  else if (act === 'reset') { exploreReset(false); A.exHint = ''; renderRight(); }
  else if (act === 'part') { if (A.mode === 'cases') return; A.part = (id === '' || A.part === id) ? '' : id; renderRight(); }
  else if (act === 'canswer') { const c = A.cs; if (!c || c.ans != null) return; c.ans = +id; A.caseScore.t++; if (c.opts[c.ans] === c.sc) A.caseScore.r++; renderPicker(); renderRight(); }
  else if (act === 'cnext') newCase();
  else if (act === 'creplay') { const c = A.cs; A.sc = c.sc; setMode('scenarios'); A.t = c.t; lastEvIdx = -2; renderRight(); }
  else if (act === 'intro') { $('#intro').hidden = true; }
  else if (act === 'link') { const u = location.href; const done = () => { b.textContent = 'Link copied'; setTimeout(() => b.textContent = 'Copy link', 1600); }; if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, done); else done(); }
  else if (act === 'theme') applyTheme(b.dataset.theme);
  else if (act === 'csv') exportCSV();
  else if (act === 'excsv') exportExploreCSV();
  else if (act === 'sheet') printSheet(id, b.dataset.key === '1');
  else if (act === 'exlink') { const u = location.href.split('#')[0] + '#explore?' + exQuery(); setHash('explore?' + exQuery()); const done = () => { b.textContent = 'Link copied'; setTimeout(() => b.textContent = 'Copy link to this experiment', 1600); }; if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, done); else done(); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.k; if (!k) return;
  const el = e.target; A.ex[k] = el.type === 'checkbox' ? el.checked : parseFloat(el.value);
  const o = $('#o_' + k); if (o) { CTL.forEach(g => g.items.forEach(it => { if (it.k === k) o.textContent = it.fmt(A.ex[k]); if (it.slider && it.slider.k === k) o.textContent = it.slider.fmt(A.ex[k]); })); }
});
document.addEventListener('change', e => {
  const id = e.target.id, val = e.target.value;
  if (id === 'exSpeed') A.exSpeed = +val;
  else if (id === 'profSel') {
    A.prof = val; setProfile(val); if (A.cmp === val) A.cmp = ''; for (const k in rangeCache) delete rangeCache[k];
    if (A.mode === 'explore') { exploreReset(true); renderPicker(); renderRight(); } else loadScenario(A.sc);
  } else if (id === 'normTog') { A.norm = e.target.checked;
  } else if (id === 'scSel') { loadScenario(val);
  } else if (id === 'cmpSel') { A.cmp = val; for (const k in rangeCache) delete rangeCache[k]; loadScenario(A.sc); }
});
const CSV_COLS = [['sympathetic_drive_index', 'sym'], ['heart_rate_bpm', 'hr'], ['systolic_mmHg', 'sbp'], ['diastolic_mmHg', 'dbp'], ['mean_arterial_pressure_mmHg', 'map'], ['cardiac_output_L_min', 'co'], ['vessel_width_pct_of_rest', 'width'], ['blood_volume_L', 'bv'], ['breathing_rate_per_min', 'rr'], ['blood_oxygen_pct', 'spo2'], ['blood_CO2_mmHg', 'pco2'], ['core_temperature_C', 'temp']];
function download(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function exportCSV() {
  if (A.mode === 'explore' || !A.res) return;
  let out = '# Physyra simulated data. ' + SCD[A.sc].name + ', ' + PROFILES[A.prof].name + '. Illustrative model output, not clinical data.\n' + 'time_s,' + CSV_COLS.map(c => c[0]).join(',') + '\n';
  A.res.series.forEach((s, i) => { out += (i * A.res.sampleDt).toFixed(2) + ',' + CSV_COLS.map(c => s[c[1]].toFixed(3)).join(',') + '\n'; });
  download('physyra-' + A.sc + '-' + A.prof + '.csv', out);
}
function exQuery() {
  const p = []; for (const k in EX0) if (A.ex[k] !== EX0[k]) p.push(k + '=' + (typeof EX0[k] === 'boolean' ? (A.ex[k] ? 1 : 0) : A.ex[k]));
  if (A.prof !== 'adult') p.push('prof=' + A.prof); return p.join('&');
}
function exportExploreCSV() {
  if (!hist.length) return; const dt = 0.5 * A.exSpeed;
  let out = '# Physyra Explore session. ' + PROFILES[A.prof].name + '. Settings: ' + (exQuery() || 'defaults') + '. time_rel_s is body time relative to the last sample. Illustrative model output, not clinical data.\n' + 'time_rel_s,' + CSV_COLS.map(c => c[0]).join(',') + '\n';
  hist.forEach((s, i) => { out += ((i - (hist.length - 1)) * dt).toFixed(1) + ',' + CSV_COLS.map(c => s[c[1]].toFixed(3)).join(',') + '\n'; });
  download('physyra-explore.csv', out);
}
document.addEventListener('input', e => {
  if (e.target.id !== 'gSearch') return;
  const q = e.target.value.trim().toLowerCase(); let n = 0;
  $$('#gList .gterm').forEach(el => { const ok = !q || el.dataset.q.indexOf(q) >= 0; el.hidden = !ok; if (ok) n++; });
  $('#gCount').textContent = q ? n + ' of ' + GL.length + ' terms' : GL.length + ' terms'; $('#gEmpty').hidden = n > 0;
});
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey) return;
  if (A.mode === 'explore') return;
  if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); $('#play').click(); }
  else if (e.key === 'ArrowRight') seek(A.t + D() / 60, true);
  else if (e.key === 'ArrowLeft') seek(A.t - D() / 60, true);
});
$('#speed').addEventListener('change', e => { A.speed = +e.target.value; });

/* ================= loop ================= */
let last = 0;
function frame(ts) {
  const dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts;
  if (A.mode === 'explore') exploreTick(dt);
  else if (A.playing) {
    A.t += dt * rate();
    if (A.t >= D()) { A.t = D(); A.playing = false; }
  }
  render(ts, dt);
  requestAnimationFrame(frame);
}
function buildAnat() {
  $('#anat').innerHTML = '<span class="glabel">Anatomy</span>' + Object.keys(ANAT).map(k => '<button class="chip" data-act="part" data-id="' + k + '" style="--c:var(' + SYS[ANAT[k].sys].v + ')">' + ANAT[k].title + '</button>').join('');
}
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode);
  const meta = document.getElementById('csMeta'); if (meta) meta.content = mode === 'auto' ? 'light dark' : mode;
  try { localStorage.setItem('physyra-theme', mode); } catch (e) {}
  $$('[data-act="theme"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.theme === mode));
  readTheme();
}
function savedTheme() { try { return localStorage.getItem('physyra-theme') || 'light'; } catch (e) { return 'light'; } }
function boot() {
  applyTheme(savedTheme()); initFigure(); buildChannels();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readTheme(); });
  if (window.ResizeObserver) new ResizeObserver(() => fitAll()).observe($('#channels')); else window.addEventListener('resize', fitAll);
  buildAnat(); buildGlossary();
  $('#goalsBody').innerHTML = SCN.map(s => '<tr><td>' + s.name + '</td><td>' + GOALS[s.id] + '</td></tr>').join('');
  $('#sheetBody').innerHTML = SCN.map(s => '<tr><td>' + s.name + '</td><td><button class="btn" data-act="sheet" data-id="' + s.id + '">Worksheet</button> <button class="btn" data-act="sheet" data-id="' + s.id + '" data-key="1">Answer key</button></td></tr>').join('');
  $('#profBody').innerHTML = PROF_ROWS();
  const h0 = location.hash.slice(1).split('?'), hm = h0[0], hq = h0[1];
  if (hq) hq.split('&').forEach(kv => { const p = kv.split('='); if (p[0] === 'prof' && PROFILES[p[1]]) { A.prof = p[1]; setProfile(p[1]); } });
  loadScenario('stand');
  if (SCD[hm]) loadScenario(hm);
  else if (['explore', 'challenge', 'cases', 'about', 'glossary'].indexOf(hm) >= 0) {
    setMode(hm);
    if (hm === 'explore' && hq) {
      hq.split('&').forEach(kv => { const p = kv.split('='); if (p[0] in EX0) A.ex[p[0]] = typeof EX0[p[0]] === 'boolean' ? p[1] === '1' : parseFloat(p[1]); });
      exploreReset(true); renderPicker(); renderRight();
    }
  }
  requestAnimationFrame(frame);
}
boot();
