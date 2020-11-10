/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Megan Hawksworth and Addi Reynolds
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_USERS = "users";
rhit.FB_KEY_DATE_JOINED = "dateJoined";
rhit.FB_KEY_IS_PUBLIC = "isPublic";
rhit.FB_KEY_NUM_CAPS = "numCaps";
rhit.FB_KEY_USERNAME = "username";
rhit.FB_KEY_USER_PIC = "userPic";

rhit.FB_COLLECTION_CAPS = "cap";
rhit.FB_KEY_LOCATION = "location";
rhit.FB_KEY_DRINK_NAME = "drinkName";
rhit.FB_KEY_QUALITY = "quality";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_DATE_FOUND = "dateFound";
rhit.FB_KEY_PIC = "pic";
// rhit.FB_KEY_USER ="user";
rhit.capsManager = null;
rhit.singleCapManager = null;
rhit.signInUpManager = null;
rhit.usersManager = null;
rhit.myAccountManager = null;
rhit.statsManager = null;

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Home Page            /////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

rhit.MainPageController = class {
	constructor() {
		document.getElementById("userText").addEventListener("click", (event) => {
			if (rhit.signInUpManager.isSignedIn) {
				window.location.href = "myAccount.html"
			} else {
				window.location.href = "auth_signin.html"
			}
		});
		this.updatePage();
	}

	updatePage() {
		let userText = document.getElementById("userText");
		if (rhit.signInUpManager.isSignedIn) {
			let ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.signInUpManager.uid);
			ref.onSnapshot((doc) => {
				let username = doc.get(rhit.FB_KEY_USERNAME);
				userText.innerHTML = username;
			});

		} else {
			userText.innerHTML = "Guest";
		}
	}
}

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Collection Page            /////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.CollectionPageController = class {
	constructor() {

		// Add cap listeners
		document.querySelector("#fileInput").addEventListener("change", (event) => {
			const file = event.target.files[0];
			console.log(`Received file named ${file.name}`);
			const storageRef = firebase.storage().ref().child(rhit.signInUpManager.uid + file.name);
			storageRef.put(file).then((uploadTaskSnapshot) => {
				console.log("The file has been uploaded!");
				storageRef.getDownloadURL().then((downloadUrl) => {
					document.getElementById("inputImage").src = downloadUrl;
				});
			});
		});

		document.querySelector("#submitSearchCap").addEventListener("click", (event) => {
			const searchQuery = document.querySelector("#inputSearchCriteria").value;
			rhit.capsManager.search(searchQuery);
		});

		document.querySelector("#submitAddCap").addEventListener("click", (event) => {
			const drinkName = document.querySelector("#inputDrinkName").value;
			const quality = document.querySelector('input[name="quality"]:checked').value;
			const location = document.querySelector("#inputLocation").value;
			const dateFound = document.querySelector("#inputDateFound").value;
			const description = document.querySelector("#inputDescription").value;
			var pic = document.getElementById("inputImage").src;
			if (pic === "https://cdn2.iconfinder.com/data/icons/rounded-white-basic-ui-set-3/139/Photo_Add-RoundedWhite-512.png") {
				//TODO: Add default pic here	
				// pic = "data:image/jpeg;base64,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";
			}
			rhit.capsManager.add(drinkName, quality, location, dateFound, description, pic);
		});
		$("#addCapDialog").on("show.bs.modal", (event) => {
			// pre animation
			document.querySelector("#inputDrinkName").value = "";
			var quality = document.getElementsByName("quality");
			for (var i = 0; i < quality.length; i++) {
				quality[i].checked = false;
			}
			quality[2].checked = true;
			document.getElementById("inputImage").src = "https://cdn2.iconfinder.com/data/icons/rounded-white-basic-ui-set-3/139/Photo_Add-RoundedWhite-512.png";
			document.querySelector("#inputLocation").value = "";
			document.querySelector("#inputDateFound").value = "";
			document.querySelector("#inputDescription").value = "";
		});
		$("#addCapDialog").on("shown.bs.modal", (event) => {
			// post animation
			document.querySelector("#inputDrinkName").focus();
		});


		// Delete cap listeners
		document.querySelector("#deleteButton").addEventListener("click", (event) => {
			let ids = getCheckedCapsId();
			let numCapsSelected = ids.length;
			document.querySelector("#deleteCapText").innerHTML = `Are you sure you want to delete cap(s) from your collection? <br> You have selected ${numCapsSelected} caps`;
		});
		document.querySelector("#submitDeleteCap").addEventListener("click", (event) => {
			let ids = getCheckedCapsId();
			rhit.capsManager.delete(ids);
		});


		// Sorting listeners
		document.querySelector("#sortCapsAlph").addEventListener("click", (event) => {
			rhit.capsManager.setquery("Alph");
			rhit.capsManager.stopListening();
			rhit.capsManager.beginListening(this.updateView.bind(this));
		});
		document.querySelector("#sortCapsDate").addEventListener("click", (event) => {
			rhit.capsManager.setquery("Date");
			rhit.capsManager.stopListening();
			rhit.capsManager.beginListening(this.updateView.bind(this));
		});
		document.querySelector("#sortCapsQuality").addEventListener("click", (event) => {
			rhit.capsManager.setquery("Quality");
			rhit.capsManager.stopListening();
			rhit.capsManager.beginListening(this.updateView.bind(this));
		});


		// start listening
		rhit.capsManager.beginListening(this.updateView.bind(this))
	}
	updateView() {
		if (rhit.capsManager.user != rhit.signInUpManager.uid) {
			document.getElementById("collectionTitleText").innerHTML = "Explore - Collection"
			document.getElementById("addButton").style.display = "none";
			document.getElementById("deleteButton").style.display = "none";
		}
		const newList = htmlToElement('<div id="capsListContainer"></div>')
		console.log(rhit.capsManager.length, "length?");
		for (let i = 0; i < rhit.capsManager.length; i++) {
			const cap = rhit.capsManager.getCapAtIndex(i);
			const newCard = this._createCard(cap);

			newCard.querySelector("#capPic").onclick = (event) => {
				window.location.href = `/details.html?id=${cap.id}&user=${rhit.capsManager.user}`
			};

			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#capsListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);

	}
	_createCard(cap) {
		return htmlToElement(`<div class="capCard row">
        <div class="input-group mb-3 col-1">
          <div class="input-group-prepend">
            <div class="input-group-text">
              <input type="checkbox" value="${cap.id}" aria-label="checkbox for cap">
            </div>
          </div>
        </div>
        <div class="col-3">
          <img src="${cap.pic}" alt="example cap" id="capPic">
        </div>
        <div class="col-8">
          <h5>${cap.drinkName}</h5>
          <span><strong>${cap.quality}</strong></span>
          <br>
          <span class="overflow-hidden descript">${cap.description}</span>
        </div>
      </div>`);
	}
}

function getCheckedCapsId() {
	let ids = []
	var checkboxes = document.querySelectorAll("input[type='checkbox']");
	for (let i = 1; i < checkboxes.length; i++) {
		if (checkboxes[i].checked == true) {
			console.log("Pushing 1 cap to checked. index: ", i);
			ids.push(checkboxes[i].value);
		}
	}
	return ids;
}

rhit.CapsManager = class {
	constructor(userId) {
		this._documentSnapshots = [];
		this._user = userId;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._user).collection(rhit.FB_COLLECTION_CAPS);
		this._unsubscribe = null;
		this._queryDate = this._ref.orderBy(rhit.FB_KEY_DATE_FOUND, "desc").limit(50);
		this._queryName = this._ref.orderBy(rhit.FB_KEY_DRINK_NAME).limit(50);
		this._queryQuality = this._ref.orderBy(rhit.FB_KEY_QUALITY, "desc").limit(50);
		this.queryType = "Date";
	}
	add(drinkName, quality, location, dateFound, description, pic) {
		console.log("adding cap now!");
		this._ref.add({
				[rhit.FB_KEY_DRINK_NAME]: drinkName,
				[rhit.FB_KEY_QUALITY]: quality,
				[rhit.FB_KEY_LOCATION]: location,
				[rhit.FB_KEY_DATE_FOUND]: dateFound,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_PIC]: pic,
			})
			.then(function (docRef) {
				rhit.myAccountManager.incNumCaps();
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.log("Error adding document: ", error);
			});
	}
	delete(ids) {
		if (!!ids.length) {
			for (let i = 0; i < ids.length; i++) {
				let ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._user).collection(rhit.FB_COLLECTION_CAPS).doc(ids[i]);
				rhit.myAccountManager.decNumCaps();
				ref.delete();
			}
		} else {
			console.log("No caps to delete");
		}

	}

	search(searchQuery) {
		let results = this._ref.orderBy('drinkName').startAt(searchQuery).endAt(searchQuery+"\uf8ff");
		console.log(results);
	}

	beginListening(changeListener) {
		var query = this._queryDate;
		if (this.queryType === "Alph") {
			query = this._queryName;
		}
		if (this.queryType === "Quality") {
			query = this._queryQuality;
		}
		if (this.queryType === "Date") {
			query = this._queryDate;
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log(this._documentSnapshots);
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length
	}

	get user() {
		return this._user;
	}

	setquery(orderType) {
		this.queryType = orderType;
	}
	getCapAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const cap = new rhit.Caps(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_DRINK_NAME),
			docSnapshot.get(rhit.FB_KEY_QUALITY),
			docSnapshot.get(rhit.FB_KEY_LOCATION),
			docSnapshot.get(rhit.FB_KEY_DATE_FOUND),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
			docSnapshot.get(rhit.FB_KEY_PIC),
		);
		return cap;
	}
}

rhit.Caps = class {
	constructor(id, drinkName, quality, location, dateFound, description, pic) {
		this.id = id;
		this.drinkName = drinkName;
		this.quality = quality.slice(2, quality.length);
		this.location = location;
		this.dateFound = dateFound;
		this.description = description;
		this.pic = pic;
	}
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Detail Page            /////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.DetailsPageController = class {
	constructor() {
		// Add cap listeners
		document.querySelector("#submitEditCap").addEventListener("click", (event) => {
			const drinkName = document.querySelector("#inputDrinkName").value;
			const quality = document.querySelector('input[name="quality"]:checked').value;
			const location = document.querySelector("#inputLocation").value;
			const dateFound = document.querySelector("#inputDateFound").value;
			const description = document.querySelector("#inputDescription").value;
			var pic = document.getElementById("inputImage").src;
			rhit.singleCapManager.edit(drinkName, quality, location, dateFound, description, pic);
		});
		document.querySelector("#fileInput").addEventListener("change", (event) => {
			const file = event.target.files[0];
			console.log(`Received file named ${file.name}`);
			const storageRef = firebase.storage().ref().child(rhit.signInUpManager.uid + file.name);
			storageRef.put(file).then((uploadTaskSnapshot) => {
				console.log("The file has been uploaded!");
				storageRef.getDownloadURL().then((downloadUrl) => {
					document.getElementById("inputImage").src = downloadUrl;
				});
			});
		});
		$("#editCapDialog").on("show.bs.modal", (event) => {
			// pre animation
			document.querySelector("#inputDrinkName").value = rhit.singleCapManager.drinkName;
			var quality = rhit.singleCapManager.quality;
			var qualBtns = document.getElementsByName("quality");
			for (var i = 0; i < qualBtns.length; i++) {
				if (qualBtns[i].value == quality) {
					qualBtns[i].checked = true;
				}
			}
			document.querySelector("#inputLocation").value = rhit.singleCapManager.location;
			document.querySelector("#inputDateFound").value = rhit.singleCapManager.dateFound;
			document.querySelector("#inputDescription").value = rhit.singleCapManager.description;
			document.querySelector("#inputImage").src = rhit.singleCapManager.pic;
		});
		$("#addCapDialog").on("shown.bs.modal", (event) => {
			// post animation
			document.querySelector("#inputDrinkName").focus();
		});


		// Delete cap listeners
		document.querySelector("#submitDeleteCap").addEventListener("click", (event) => {
			rhit.singleCapManager.delete().then(function () {
				console.log("Document successfully deleted!");
				window.location.href = "mycollection.html";
			}).catch(function (error) {
				console.error("Error removing document:", error);
			});;
		});

		rhit.singleCapManager.beginListening(this.updateView.bind(this))
	}
	updateView() {
		if (rhit.singleCapManager.user != rhit.signInUpManager.uid) {
			document.getElementById("editButton").style.display = "none";
			document.getElementById("deleteButton").style.display = "none";
		}
		document.querySelector("#detailDrinkName").innerHTML = rhit.singleCapManager.drinkName;
		document.querySelector("#detailPic").src = rhit.singleCapManager.pic;
		var quality = rhit.singleCapManager.quality
		document.querySelector("#detailQuality").innerHTML = "<strong>" + quality.slice(2, quality.length) + "<strong>";
		document.querySelector("#detailLocation").innerHTML = rhit.singleCapManager.location;
		document.querySelector("#detailDate").innerHTML = rhit.singleCapManager.dateFound;
		document.querySelector("#detailDescription").innerHTML = rhit.singleCapManager.description;
	}
}

rhit.SingleCapManager = class {
	constructor(userId, capId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._user = userId;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._user).collection(rhit.FB_COLLECTION_CAPS).doc(capId);
	}
	edit(drinkName, quality, location, dateFound, description, pic) {
		this._ref.update({
				[rhit.FB_KEY_DRINK_NAME]: drinkName,
				[rhit.FB_KEY_QUALITY]: quality,
				[rhit.FB_KEY_LOCATION]: location,
				[rhit.FB_KEY_DATE_FOUND]: dateFound,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_PIC]: pic,
			})
			.then(function () {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}
	delete() {
		rhit.myAccountManager.decNumCaps();
		return this._ref.delete();
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get user() {
		return this._user;
	}
	get drinkName() {
		return this._documentSnapshot.get(rhit.FB_KEY_DRINK_NAME);
	}
	get quality() {
		return this._documentSnapshot.get(rhit.FB_KEY_QUALITY);
	}
	get location() {
		return this._documentSnapshot.get(rhit.FB_KEY_LOCATION);
	}
	get dateFound() {
		return this._documentSnapshot.get(rhit.FB_KEY_DATE_FOUND);
	}
	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}
	get pic() {
		return this._documentSnapshot.get(rhit.FB_KEY_PIC);
	}
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Explore Page            ////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.ExplorePageController = class {
	constructor() {
		// start listening
		rhit.usersManager.beginListening(this.updateView.bind(this))
	}
	updateView() {
		const newList = htmlToElement('<div id="capsListContainer"></div>')
		for (let i = 0; i < rhit.usersManager.length; i++) {
			const user = rhit.usersManager.getUserAtIndex(i);
			const newCard = this._createCard(user);

			newCard.querySelector("#userPic").onclick = (event) => {
				window.location.href = `/mycollection.html?user=${user.id}`
			};
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#capsListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
	_createCard(user) {
		return htmlToElement(`<div id="${user.id}" class="capCard row">
        <div class="col-3">
          <img id="userPic" src="${user.pic}" alt="example cap">
        </div>
        <div class="col-9">
          <h5>${user.username}</h5>
          <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${user.numCaps} Bottle Caps</span>
        </div>
      </div>`);
	}
}

rhit.UsersManager = class {
	constructor() {
		this._documentSnapshots = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).limit(50).where(rhit.FB_KEY_IS_PUBLIC, "==", true);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			console.log(this._documentSnapshots);
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length
	}
	getUserAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const user = new rhit.Users(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_DATE_JOINED),
			docSnapshot.get(rhit.FB_KEY_IS_PUBLIC),
			docSnapshot.get(rhit.FB_KEY_NUM_CAPS),
			docSnapshot.get(rhit.FB_KEY_USERNAME),
			docSnapshot.get(rhit.FB_KEY_USER_PIC),
		);
		return user;
	}
}





// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Stats Page            //////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.StatsPageController = class {
	constructor() {
		this.svg = null;
		this.x = null;
		this.gx=null;
		this.y=null;
		this.xAxis = null;
		this.path = null;
		this.data = null;

		console.log("On the stats page!");
		var radioButtons = document.querySelectorAll("input[name='domain']");
		var domain;
		radioButtons.forEach((button) => {
			button.onclick = () => {
				var now = new Date();
				if (button.value == "Year") {
					let start = now.setFullYear(now.getFullYear() - 1);
					domain = [start, new Date()];
					this.xAxis.ticks(12).tickFormat(d3.timeFormat('%b'));
				} else if (button.value == "Month") {
					let start = now.setMonth(now.getMonth() - 1);
					domain = [start, new Date()];
					this.xAxis.ticks(d3.timeDay.every(3)).tickFormat(d3.timeFormat('%m/%d'));
				} else if (button.value == "Week") {
					let start = now.setDate(now.getDate() - 7);
					domain = [start, new Date()];
					this.xAxis.ticks(7).tickFormat(d3.timeFormat('%d'));
				} else {
					domain = null;
				}
				this._updateLine(domain);
			}
		})
		rhit.statsManager.beginListening(this.updateView.bind(this));
	}
	updateView(domainText) {
		if (rhit.statsManager.length < 3) {
			document.getElementById("noCapsText").innerHTML = "Add more caps to see your statistics!";
			var statsTexts = document.querySelectorAll(".statsText");
			statsTexts[0].innerHTML = "";
			statsTexts[1].innerHTML = "";
			statsTexts[2].innerHTML = "";
		} else {
			this._makeLine();
			this._makePie();
		}
	}

	// Template D3 line graph from: https://www.d3-graph-gallery.com/graph/line_basic.html
	_makeLine() {
		// set the dimensions and margins of the graph
		var margin = {
				top: 10,
				right: 30,
				bottom: 30,
				left: 60
			},
			width = 460 - margin.left - margin.right,
			height = 400 - margin.top - margin.bottom;

		// append the svg object to the body of the page
		this.svg = d3.select("#capsOverTime")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");


		var data = rhit.statsManager.getDates();
		this.data = data;

		// Add X axis --> it is a date format
		var x = d3.scaleTime()
			.domain(d3.extent(data, function (d) {
				return d.date;
			}))
			.range([0, width]);
		this.x = x;
		this.xAxis = d3.axisBottom(x)
			.tickFormat(d3.timeFormat('%b'));
		this.gx =this.svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(this.xAxis);

		// Max value observed:
		const max = d3.max(data, function (d) {
			return +d.value;
		})

		// Add Y axis
		var y = d3.scaleLinear()
			.domain([0, max])
			.range([height, 0]);
		this.y=y;
		this.svg.append("g")
			.call(d3.axisLeft(y));

		// create a tooltip
		var Tooltip = d3.select("#capsOverTime")
			.append("div")
			.style("opacity", 0)
			.attr("class", "tooltip")
			.style("background-color", "white")
			.style("border", "solid")
			.style("border-width", "2px")
			.style("border-radius", "5px")
			.style("padding", "5px")

		// Three function that change the tooltip when user hover / move / leave a cell
		var mouseover = function (d) {
			Tooltip
				.style("opacity", 1)
			d3.select(this)
				.style("stroke", "black")
				.style("opacity", 1)
		}
		var mousemove = function (d) {
			var x0 = x.invert(d3.mouse(this)[0]);
			var bisect = d3.bisector(function (d) {
				return d.date;
			}).left;
			var i = bisect(data, x0, 1);
			var point = data[i];
			//console.log("over", point);
			Tooltip
				.html("Date: " + point.dateString + "<br>Value: " + point.value)
				.style("left", (d3.mouse(this)[0] + 6) + "px")
				.style("top", (d3.mouse(this)[1] + 70) + "px")
		}
		var mouseleave = function (d) {
			Tooltip
				.style("opacity", 0)
		}

		// Add the line
		this.path = this.svg.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("stroke-width", 2)
			.attr("d", d3.line()
				.x(function (d) {
					//console.log(d.date);
					return x(d.date)
				})
				.y(function (d) {
					return y(d.value)
				})
			)
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseleave", mouseleave)
	}

	_updateLine(domain) {
		if (!domain) {
			domain = d3.extent(this.data, function (d) {
				return d.date;
			});
		}
		console.log(domain);
		const t = this.svg.transition().duration(750);
		var x = this.x;
		var y = this.y;
		this.x.domain(domain);
		this.gx.transition(t).call(this.xAxis, this.x);
		this.path.transition(t).attr("d", d3.line()
			.x(function (d) {
				//console.log(d.date);
				return x(d.date) || 0
			})
			.y(function (d) {
				return y(d.value) || 0
			})
		);
	}


	// Template d3 pir chart from: https://www.d3-graph-gallery.com/graph/pie_changeData.html
	_makePie() {
		// set the dimensions and margins of the graph
		var width = 450;
		var height = 450;
		var margin = 40;

		// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
		var radius = Math.min(width, height) / 2 - margin

		// append the svg object to the div called 'my_dataviz'
		var svg = d3.select("#capsInPlaces")
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var data = rhit.statsManager.getLocations();

		// set the color scale
		var color = d3.scaleOrdinal(d3.schemeCategory20);

		// create a tooltip
		var Tooltip = d3.select("#capsInPlaces")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.style("background-color", "white")
			.style("border", "solid")
			.style("border-width", "2px")
			.style("border-radius", "5px")
			.style("padding", "5px")

		var mouseover = function (d) {
			Tooltip.style("opacity", 1)
		}
		var mousemove = function (d) {

			Tooltip.html("Location: " + d.data.key + "<br># Caps: " + d.data.value)
				.style("left", (d3.mouse(this)[0] + 200) + "px")
				.style("top", (d3.mouse(this)[1] + 200) + "px");
		};

		var mouseout = function () {
			Tooltip.style("opacity", 0);
		};

		// Compute the position of each group on the pie:
		var pie = d3.pie()
			.value(function (d) {
				return d.value;
			})
			.sort(function (a, b) {
				return d3.ascending(a.key, b.key);
			}) // This make sure that group order remains the same in the pie chart
		var data_ready = pie(d3.entries(data))

		// map to data
		var u = svg.selectAll("path")
			.data(data_ready)

		// Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
		u
			.enter()
			.append('path')
			.on("mouseover", mouseover)
			.on("mousemove", mousemove)
			.on("mouseout", mouseout)
			.merge(u)
			.transition()
			.duration(1000)
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(radius)
			)
			.attr('fill', function (d) {
				return (color(d.data.key))
			})
			.attr("stroke", "white")
			.style("stroke-width", "2px")
			.style("opacity", 1)
	}
}

rhit.StatsManager = class {
	constructor(uid) {
		this._documentSnapshots = [];
		this._unsubscribe = null;
		this._uid = uid;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(uid).collection(rhit.FB_COLLECTION_CAPS).orderBy(rhit.FB_KEY_DATE_FOUND);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length
	}
	getDateAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		return docSnapshot.get(rhit.FB_KEY_DATE_FOUND);
	}
	getLocationAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		return docSnapshot.get(rhit.FB_KEY_LOCATION);
	}

	getDates() {
		var dates = [];
		var counts = [];
		var caps = this._documentSnapshots;
		var total = 0;
		for (let i = 0; i < caps.length; i++) {
			var currentDate = caps[i].get(rhit.FB_KEY_DATE_FOUND)
			total++;
			if (dates.includes(currentDate)) {
				let i = dates.indexOf(currentDate);
				counts[i] = total;
			} else {
				dates.push(currentDate);
				counts.push(total);
			}
		}
		var objects = [];
		for (let i = 0; i < dates.length; i++) {
			objects.push({
				date: d3.timeParse("%Y-%m-%d")(dates[i]),
				dateString: dates[i],
				value: counts[i],
			});
		}
		console.log(objects);
		return objects;
	}

	getLocations() {
		var locations = [];
		var counts = [];
		var caps = this._documentSnapshots;
		for (let i = 0; i < caps.length; i++) {
			var currentLocation = caps[i].get(rhit.FB_KEY_LOCATION);
			if (locations.includes(currentLocation)) {
				let i = locations.indexOf(currentLocation);
				counts[i]++;
			} else {
				locations.push(currentLocation);
				counts.push(1);
			}
		}
		var objects = {};
		for (let i = 0; i < locations.length; i++) {
			objects[locations[i]] = counts[i];
		}
		return objects;
	}
}



// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           My Account Page            //////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.MyAccountPageController = class {
	constructor() {
		document.querySelector("#fileInput").addEventListener("change", (event) => {
			const file = event.target.files[0];
			console.log(`Received file named ${file.name}`);
			const storageRef = firebase.storage().ref().child(rhit.signInUpManager.uid + file.name);
			storageRef.put(file).then((uploadTaskSnapshot) => {
				console.log("The file has been uploaded!");
				storageRef.getDownloadURL().then((downloadUrl) => {
					document.getElementById("editImage").src = downloadUrl;
				});
			});
		});
		document.querySelector("#submitEditAccount").addEventListener("click", (event) => {
			const isPublic = document.querySelector("#editPublicSwitch").checked;
			const pic = document.getElementById("editImage").src;
			const username = document.querySelector("#editUsername").value;
			rhit.myAccountManager.edit(isPublic, username, pic);
		});
		$("#editAccountDialog").on("show.bs.modal", (event) => {
			// pre animation
			document.querySelector("#editPublicSwitch").checked = rhit.myAccountManager.isPublic;
			document.getElementById("editImage").src = rhit.myAccountManager.pic;
			document.querySelector("#editUsername").value = rhit.myAccountManager.username;
		});
		$("#addCapDialog").on("shown.bs.modal", (event) => {
			// post animation
			document.querySelector("#editUsername").focus();
		});


		// Delete user listener
		document.querySelector("#submitDeleteAccount").addEventListener("click", (event) => {
			rhit.myAccountManager.delete().then(function () {
				window.location.href = "/";
			}).catch(function (error) {
				console.error("Error removing account:", error);
			});
		});

		rhit.myAccountManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#usernameText").innerHTML = rhit.myAccountManager.username;
		let valueIsPublic;
		if (rhit.myAccountManager.isPublic) {
			valueIsPublic = "Public";
		} else {
			valueIsPublic = "Private";
		}
		document.querySelector("#numCapsText").innerHTML = rhit.myAccountManager.numCaps;
		document.querySelector("#isPublicText").innerHTML = "<strong>" + valueIsPublic + "<strong>";
		document.querySelector("#detailDate").innerHTML = rhit.myAccountManager.dateJoined.toDate();
		document.getElementById("userPic").src = rhit.myAccountManager.pic;
	}
}
rhit.MyAccountManager = class {
	constructor(uid) {
		this._documentSnapshot = null;
		this._unsubscribe = null;
		this._uid = uid;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(uid);
		this._isPublic = null;
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				this._isPublic = this.isPublic;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	edit(isPublic, username, pic) {
		this._ref.update({
				[rhit.FB_KEY_IS_PUBLIC]: isPublic,
				[rhit.FB_KEY_USERNAME]: username,
				[rhit.FB_KEY_USER_PIC]: pic,
			})
			.then(function () {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}
	delete() {
		this._ref.delete().then(function () {
				console.log('Successfully deleted ref');
			})
			.catch(function (error) {
				console.log('Error deleting ref:', error);
			});;
		firebase.auth().currentUser.delete()
			.then(function () {
				console.log('Successfully deleted user');
			})
			.catch(function (error) {
				console.log('Error deleting user:', error);
			});
	}
	toggleIsPublic() {
		if (this._isPublic) {
			this._isPublic = false;
		} else {
			this._isPublic = true;
		}
		this._ref.update({
			[rhit.FB_KEY_IS_PUBLIC]: this._isPublic
		}).then(() => {
			console.log("Changed isPublic in firestore to ", this._isPublic);
		});
	}
	incNumCaps() {
		console.log("TODO: increase numCaps by 1");
		let numCaps = this.numCaps;
		this._ref.update({
			[rhit.FB_KEY_NUM_CAPS]: numCaps + 1
		}).then(() => {
			console.log("Increased numCaps in firestore");
		});
	}
	decNumCaps() {
		console.log("TODO: descrease numCaps by 1");
		let numCaps = this.numCaps;
		this._ref.update({
			[rhit.FB_KEY_NUM_CAPS]: numCaps - 1
		}).then(() => {
			console.log("Decreased numCaps in firestore");
		});
	}
	get isPublic() {
		return this._documentSnapshot.get(rhit.FB_KEY_IS_PUBLIC);
	}
	get dateJoined() {
		return this._documentSnapshot.get(rhit.FB_KEY_DATE_JOINED);
	}
	get numCaps() {
		return this._documentSnapshot.get(rhit.FB_KEY_NUM_CAPS);
	}
	get username() {
		return this._documentSnapshot.get(rhit.FB_KEY_USERNAME);
	}
	get pic() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER_PIC);
	}
}


// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////           Sign in Page            /////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
rhit.SignInPageController = class {
	constructor() {
		document.querySelector("#signInButton").onclick = (event) => {
			rhit.signInUpManager.signIn(inputEmail, inputPassword);
		};
	}
}

rhit.SignUpPageController = class {
	constructor() {
		document.querySelector("#createAccountButton").onclick = (event) => {
			rhit.signInUpManager.signUp(inputEmail, inputPassword, signUpIsPublic);
		};
	}
}

rhit.SignInUpManager = class {
	constructor() {
		this._unsubscribe = null;
		this._user = null;
		this._ref = null;
		this._username = null;
		this._documentSnapshot = null;
		this._numCaps = 0;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			console.log("auth on");
			this._user = user;
			if (this._user != null) {
				this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._user.uid);
			}
			changeListener();
		});
	}
	signIn() {
		console.log(`log in for email: ${inputEmail.value} password: ${inputPassword.value}`);
		firebase.auth().signInWithEmailAndPassword(inputEmail.value, inputPassword.value)
			.then(function () {
				window.location.href = '/';
			}).catch(function (error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;

				document.getElementById("loginFailText").innerHTML = "&#9888; " + errorMessage;
				console.log("exsisting account log in error", errorCode, errorMessage);
			});
	}
	signUp(email, password, isPublic) {
		console.log(`create account for email: ${email.value} password: ${password.value} isPublic: ${isPublic.checked}`);
		firebase.auth().createUserWithEmailAndPassword(email.value, password.value)
			.then((userCred) => {
				console.log("adding public:", isPublic.checked);
				var re = /(\w+)\@/;
				var userNameResult = re.exec(email.value)[1];
				console.log(userNameResult);
				let ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(userCred.user.uid);
				ref.set({
					[rhit.FB_KEY_DATE_JOINED]: firebase.firestore.Timestamp.now(),
					[rhit.FB_KEY_IS_PUBLIC]: isPublic.checked,
					[rhit.FB_KEY_NUM_CAPS]: 0,
					[rhit.FB_KEY_USERNAME]: userNameResult,
					[rhit.FB_KEY_USER_PIC]: "https://www.tenforums.com/geek/gars/images/2/types/thumb_15951118880user.png",
				}).then(() => {
					window.location.href = "/";
				})
			})
			.catch(function (error) {
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				// ...
				document.getElementById("loginFailText").innerHTML = "&#9888; " + errorMessage;
				console.log("Create Account error", errorCode, errorMessage);
			});

	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		if (this._user == null) {
			return null;
		}
		return this._user.uid;
	}
}

rhit.Users = class {
	constructor(id, dateJoined, isPublic, numCaps, username, pic) {
		this.id = id;
		this.dateJoined = dateJoined;
		this.isPublic = isPublic;
		this.numCaps = numCaps;
		this.username = username;
		this.pic = pic;
	}
}



// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////              Main                /////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

rhit.initializePage = function () {
	if (rhit.signInUpManager.isSignedIn) {

		rhit.myAccountManager = new this.MyAccountManager(rhit.signInUpManager.uid);
		rhit.myAccountManager.beginListening(() => {
			if (rhit.myAccountManager.isPublic) {
				document.getElementById("publicSwitch").checked = true;
			} else {
				document.getElementById("publicSwitch").checked = false;
			}
		})

		document.getElementById("myAccountNav").style.display = "flex";
		document.getElementById("isPublicNav").style.display = "flex";
		document.getElementById("signOutBtn").style.display = "flex";
		document.getElementById("signInNavBtn").style.display = "none";
	} else {
		document.getElementById("myAccountNav").style.display = "none";
		document.getElementById("isPublicNav").style.display = "none";
		document.getElementById("signOutBtn").style.display = "none";
		document.getElementById("signInNavBtn").style.display = "flex";
	}

	if (document.querySelector("#mainPage")) {
		new rhit.MainPageController();
	}

	if (document.querySelector("#myCollectionPage")) {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		var userId = urlParams.get("user");
		if (!userId) {
			console.log("UID not in url");
			userId = rhit.signInUpManager.uid;
		}
		//if user still doesn't exist send to sign in/up
		if (!userId) {
			window.location.href = "/auth_signup.html"
		}
		rhit.capsManager = new rhit.CapsManager(userId);
		new rhit.CollectionPageController();
	}
	if (document.querySelector("#detailsPage")) {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const capId = urlParams.get("id");
		var userId = urlParams.get("user");
		if (!userId) {
			userId = rhit.signInUpManager.uid;
		}
		//if user still doesn't exist send to sign in/up
		if (!userId) {
			window.location.href = "/auth_signup.html"
		}
		if (!capId) {
			window.location.href = "mycollection.html"
		}
		console.log();
		rhit.singleCapManager = new rhit.SingleCapManager(userId, capId);
		new rhit.DetailsPageController();
	}
	if (document.querySelector("#explorePage")) {
		rhit.usersManager = new rhit.UsersManager();
		new rhit.ExplorePageController();
	}
	if (document.querySelector("#statsPage")) {
		//if user doesn't exist send to sign in/up
		if (!rhit.signInUpManager.uid) {
			window.location.href = "/auth_signup.html"
		} else {
			rhit.statsManager = new rhit.StatsManager(rhit.signInUpManager.uid);
			new rhit.StatsPageController();
		}

	}
	if (document.querySelector("#myAccountPage")) {
		//if user doesn't exist send to sign in/up
		if (!rhit.signInUpManager.uid) {
			window.location.href = "/auth_signup.html"
		}
		new rhit.MyAccountPageController();
	}

	if (document.querySelector("#signUpPage")) {
		new rhit.SignUpPageController();
	}

	if (document.querySelector("#signInPage")) {
		new rhit.SignInPageController();
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.signInUpManager = new rhit.SignInUpManager();
	rhit.signInUpManager.beginListening(() => {
		console.log("isSignedIn =", rhit.signInUpManager.isSignedIn);
		// Page initialization
		rhit.initializePage();
	});

	document.getElementById("publicSwitch").addEventListener('click', function (event) {
		console.log("Clicked public collection in menu");
		rhit.myAccountManager.toggleIsPublic();
	});
	document.getElementById("isPublicNav").addEventListener('click', function (event) {
		event.stopPropagation();
	})
	document.getElementById("signOutBtn").addEventListener('click', function (event) {
		console.log("Clicked sign out in menu");
		rhit.signInUpManager.signOut();
	});

};

rhit.main();