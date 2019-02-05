This web app is based on telematics.oasa.gr API and is developed for demo and educational purposes.

In the beginning, app displays a Main list with all bus Lines in Athens ordered by lineID. Clicking on a bus Line is displayed a list with it's Routes (usually 2 Routes: go & return), clicking a Route is displayed a list with the bus Stops in Route and finally clicking a Stop are displayed bus Arrivals expected there. Clicking a selection again, the corresponded list get closed.

Each bus Arrivals list getting refreshed every 20 seconds. App hides these lists and stops auto refresh after 3-4 minutes in order to control forgotten bus Arrivals lists and infinity requests.

App keeps in memory 6 most recent Stop selections and displays them at the bottom of the main list offering fast access to them. They are stored in browser's locastorage to be available in future app executions.

Also, there is a menu with single digits sticky at the bottom of the viewport. When a digit is selected Main list is scrolled to the Lines with lineID starting with it. Digits are from 0 to 9, A for alpharithmitical and M for most recent bus Stop selections.

API requests commited via gc-info.herokuapp.com (custom server written in Flask/Python) to bypass Cross Origin blocks.

Athens 5 Feb 2019, Giannis Clipper