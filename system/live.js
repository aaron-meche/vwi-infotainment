
let currentVersion = null;
function checkForUpdate() {
	fetch('/version')
		.then(response => response.json())
		.then(data => {
			if (currentVersion === null) {
				currentVersion = data.version;
				console.log("On version: " + data.version)
			} 
			else if (data.version !== currentVersion) {
				location.reload();
			}
		})
		.catch(err => console.error('Error checking for update:', err));
}
setInterval(checkForUpdate, 500);