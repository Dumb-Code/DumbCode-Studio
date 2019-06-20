function initTeams() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var jsonMembers = JSON.parse(this.responseText);
      fillRoles(jsonMembers);
    }
  };
  xmlhttp.open("GET", "team/team.json", true);
  xmlhttp.send();
}

function fillRoles(json) {
  for (x in json.members) {
    for (y in json.members[x].roles) {
      var tempElement = document.createElement("div");
      tempElement.innerHTML = '<article class="tile is-child notification is-dark has-background-black-ter">' +
        '<figure class="image is-48x48" style="float:left; margin-right: 20px;"><img class="is-rounded" src="https://crafatar.com/avatars/' + json.members[x].uuid + '" alt="' + json.members[x].username + '"></figure>' +
        '<p class="title is-4">' + json.members[x].name + '</p>' +
        '<p class="subtitle is-6">@' + json.members[x].username + '</p>' +
      '</article> <br>'
      document.getElementById(json.members[x].roles[y]).appendChild(tempElement);
    }
  }
}
