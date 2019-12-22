# DS1Tracker
Site to publically track the position of DS1

Run `npm install` to install the required modules.

Once that's done, you can run `npm run dev` to start a basic dev server and view the page.

Currently, a week old ISS (Zarya) TLE is hardcoded into app.js because a CORS issue is keeping us from getting live TLE data,
shouldn't be too hard to fix.

ToDo: 
* Solve CORS issue with webpack dev server (maybe switch to node server).
* Clean up the logic to pull the TLE once the CORS thing is solved.
