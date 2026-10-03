# Physyra

**See the body respond, second by second.**

Physyra is an interactive physiology simulator that runs entirely in the browser. Pick a scenario (standing up, blood loss, holding your breath, acute stress, fever, cold exposure, heat and dehydration, exercise), press play, and watch the heart, vessels, lungs, nerves and temperature control respond step by step. Then change the variables yourself, test your knowledge, and explore the anatomy.

Live site: https://physyra.netlify.app

> "The human body is complex — learning how it works shouldn't have to be."
> — Shakir Khan, Creator & Developer

## What it does

- **Scenarios:** eight timelines with play, pause, scrub and step controls, live measurements, graphs, an animated body, and a control-loop view (stimulus, sensor, control centre, effector, response).
- **Explore:** sliders for exercise, stress, posture, breath-holding, blood loss, fluid loss, heat, fever, oxygen, pump strength and vessel diameter. Experiments can be shared by link and exported as CSV.
- **Challenge and Cases:** predict what happens first, or work out what is happening to a patient from their readings.
- **Body types:** compare a typical adult, a trained athlete and an older adult.
- **Anatomy:** click the heart, lungs, brain, nerves, vessels, muscle or skin for an anatomy card.
- **Glossary and worksheets:** 45 terms, plus printable worksheets and answer keys for every scenario.

## Project structure

| File | What it contains |
| --- | --- |
| `index.html` | The page layout: header, tabs, body diagram (SVG), chart area, glossary and About sections. |
| `style.css` | All styling, including light and dark themes, the ECG-paper background, mobile layout and print styles for worksheets. |
| `model.js` | The physiology model: a small set of linked equations for the heart, vessels, breathing, blood gases, temperature and nervous control, plus the scenario definitions. |
| `app.js` | The interface: charts drawn on canvas, the animated body, scenario events and explanations, Explore, Challenge, Cases, glossary, worksheets and sharing links. |

## How the model works

- Mean arterial pressure = cardiac output x vascular resistance; cardiac output = heart rate x stroke volume.
- Stroke volume follows venous return (Frank-Starling), contractility, and heart rate.
- A baroreflex compares pressure with a set point and drives sympathetic activity after a short delay.
- Arterial CO2 = CO2 production / ventilation; oxygen saturation follows a hemoglobin curve.
- Core temperature = heat produced minus heat lost, with skin blood flow, sweating and shivering driven by the gap from a hypothalamic set point.

The values are illustrative and tuned to textbook ranges. They are not clinical data, and Physyra is not medical advice.

## Run it locally

No build step or dependencies. Open `index.html` in a browser. If you prefer a local server:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Deploy

Drag this folder into the Deploys tab of a Netlify site, or push it to a GitHub repository and connect that repository to Netlify.

## Credits

Created and directed by Shakir Khan.

Questions or feedback: skoister6666@gmail.com
