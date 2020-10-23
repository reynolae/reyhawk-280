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

// From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

function getCheckedCapsId() {
	let ids = []
	var checkboxes = document.querySelectorAll("input[type='checkbox']");
	for (let i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked == true) {
			ids.push(checkboxes[i].value)
		}
	}
	return ids;
}

rhit.CollectionPageController = class {
	constructor() {

		// Add cap listeners
		document.querySelector("#submitAddCap").addEventListener("click", (event) => {
			const drinkName = document.querySelector("#inputDrinkName").value;
			const quality = document.querySelector('input[name="quality"]:checked').value;
			const location = document.querySelector("#inputLocation").value;
			const dateFound = document.querySelector("#inputDateFound").value;
			const description = document.querySelector("#inputDescription").value;
			// const pic = document.querySelector("#fileInput").value;
			const pic = "https://i.pinimg.com/236x/ba/06/a8/ba06a8e88aafd198f1fc050891eb3298.jpg"
			rhit.capsManager.add(drinkName, quality, location, dateFound, description, pic);
		});
		$("#addCapDialog").on("show.bs.modal", (event) => {
			// pre animation
			document.querySelector("#inputDrinkName").value = "";
			var quality = document.getElementsByName("quality");
			for (var i = 0; i < quality.length; i++) {
				quality[i].checked = false;
			}
			document.querySelector("#inputLocation").value = "";
			document.querySelector("#inputDateFound").value = "";
			document.querySelector("#inputDescription").value = "";
			// document.querySelector("#fileInput").value = "";
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
			// var checkboxes = document.querySelectorAll("input[type='checkbox']");
			// for (let i = 0; i < checkboxes.length; i++) {
			// 	checkboxes[i].checked = false;
			// }
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
		const newList = htmlToElement('<div id="capsListContainer"></div>')
		// console.log(rhit.capsManager.length, "length?");
		for (let i = 0; i < rhit.capsManager.length; i++) {
			const cap = rhit.capsManager.getCapAtIndex(i);
			const newCard = this._createCard(cap);

			newCard.querySelector("#capPic").onclick = (event) => {
				window.location.href = `/details.html?id=${cap.id}`
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
          <span>${cap.description}</span>
        </div>
      </div>`);
	}
}

rhit.CapsManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CAPS);
		this._unsubscribe = null;
		this._queryDate =  this._ref.orderBy(rhit.FB_KEY_DATE_FOUND,"desc").limit(50);
		this._queryName = this._ref.orderBy(rhit.FB_KEY_DRINK_NAME).limit(50);
		this._queryQuality = this._ref.orderBy(rhit.FB_KEY_QUALITY,"desc").limit(50);
		this.queryType = "Date";
	}
	add(drinkName, quality, location, dateFound, description, pic) {
		// console.log("adding cap now!");
		this._ref.add({
				[rhit.FB_KEY_DRINK_NAME]: drinkName,
				[rhit.FB_KEY_QUALITY]: quality,
				[rhit.FB_KEY_LOCATION]: location,
				[rhit.FB_KEY_DATE_FOUND]: dateFound,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_PIC]: pic,
			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.log("Error adding document: ", error);
			});
	}
	delete(ids) {
		// console.log("One cap slected has id", ids[0]);
		if(!!ids.length){
			for(let i = 0; i < ids.length; i++) {
				let ref = firebase.firestore().collection(rhit.FB_COLLECTION_CAPS).doc(ids[i]);
				ref.delete();
			}
		} else {
			console.log("No caps to delete");
		}

	}
	beginListening(changeListener) {
		var query = this._queryDate;
		if(this.queryType === "Alph") {
			query = this._queryName;
		}
		if(this.queryType === "Quality") {
			query = this._queryQuality;
		}
		if(this.queryType === "Date") {
			query = this._queryDate;
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			console.log(this._documentSnapshots);
			this.stopListening();
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length
	}

	setquery(orderType) {
		this.queryType=orderType;
		// if(orderType === "Date") {
		// 	this._query = this._ref.orderBy(rhit.FB_KEY_DATE_FOUND, "desc").limit(50); 
		// }
		// if(orderType === "Quality") {
		// 	this._query = this._ref.orderBy(rhit.FB_KEY_QUALITY, "desc").limit(50); 
		// }
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
		this.quality = quality.slice(2,quality.length);
		this.location = location;
		this.dateFound = dateFound;
		this.description = description;
		this.pic = pic;
	}
}

rhit.DetailsPageController = class {
	constructor() {}
	updateView() {}
}

rhit.SingleCapManager = class {
	constructor(id) {
		this._id = id;
	}
	edit(drinkName, quality, location, dateFound, description, pic) {}
	delete() {}
	beginListening(changeListener) {}
	stopListening() {}
	get drinkName() {}
	get quality() {}
	get location() {}
	get dateFound() {}
	get description() {}
	get pic() {}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	if (document.querySelector("#myCollectionPage")) {
		rhit.capsManager = new rhit.CapsManager();
		new rhit.CollectionPageController();
	}
};

rhit.main();