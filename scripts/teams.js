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
      var tempString =
      tempString = '<article class="tile is-child notification is-dark has-background-black-ter">' +
        '<figure class="image is-48x48" style="float:left; margin-right: 20px;"><img class="is-rounded" src="https://crafatar.com/avatars/' + json.members[x].uuid + '" alt="' + json.members[x].username + '"></figure>' +
        '<p class="title is-4">' + json.members[x].name + '</p>' +
        '<p class="subtitle is-6">@' + json.members[x].username + '</p>';
      if (json.members[x].projects.includes("dl")) {
        tempString += '<div class="tag has-addons is-dark" style="margin-right: 3px;"><span class="tag is-warning"></span><span class="tag is-dark">dumb-library</span></div>';
      }
      if (json.members[x].projects.includes("pn")) {
        tempString += '<div class="tag has-addons is-dark" style="margin-right: 3px;"><span class="tag is-primary"></span><span class="tag is-dark">project: nublar</span></div>';
      }
      if (json.members[x].projects.includes("todm")) {
        tempString += '<div class="tag has-addons is-dark" style="margin-right: 3px;"><span class="tag is-danger "></span><span class="tag is-dark" >todm</span></div>';
      }
      tempString += '</article> <br>';
      tempElement.innerHTML = tempString;
      document.getElementById(json.members[x].roles[y]).appendChild(tempElement);
    }
  }
}
