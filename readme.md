This web app is based on telematics.oasa.gr API and is developed for demo and educational purposes.

In the beginning, app displays a main list with all bus lines in Athens ordered by lineID. Clicking on a bus line is displayed a list with it's routes (usually 2 routes: go & return), clicking a route is displayed a list with the bus stops in route and finally clicking a stop are displayed bus arrivals expected there. Clicking a selection again, the corresponded list get closed.

Every list with bus arrivals is getting refreshed every 20 seconds, as long as is open. 

App keeps in memory 6 most recent stop selections and displays them at the bottom of the main list offering fast access to them. They are stored in browser's locastorage to be available in future app executions.

Also, there is a menu with single digits sticky at the bottom of the viewport. When a digit is selected main list is scrolled to the lines with lineID starting with it. Digits are from 0 to 9, A for alpharithmitical and M for most recent bus stop selections.

API requests commited via gc-info.herokuapp.com (custom server written in Flask/Python) to bypass Cross Origin blocks.

Athens 5 Feb 2019, Giannis Clipper