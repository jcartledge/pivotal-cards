/*
 *
 *  Print a https://www.pivotaltracker.com view as index cards
 *
 *  depends on jQuery and Underscore and the Pivotal code ..
 *
 *  released under the WTFPL licence
 *
 *  https://github.com/psd/pivotal-cards
 *
 */
(function ($) {

  var options = {
    "filing-colours": true,
    "rubber-stamp": true,
    "double-sided": true,
    "white-backs": true
  };

  var make_front = _.template(
    '<div class="<%= story_type %> card" id="front-<%= cardno %>">' +
    ' <div class="front side">' +
    '   <div class="header">' +
    '     <span class="labels">' +
    '<% _.each(labels, function(label) { %> <span class="label"><%= label %></span> <% }); %>' +
    '     <span>' +
    '   </div>' +
    '   <div class="middle">' +
    '     <div class="story-title"><%= name %></div>' +
    '     <div class="story-type"><%= story_type %></div>' +
    '   </div>' +
    '   <div class="footer">' +
    '     <span class="epic_name"><%= epic_name %></span>' +
    '     <span class="points points<%= points %>"><span><%= points %></span></span>' +
    '   </div>' +
    ' </div>' +
    '</div>');

  var make_back = _.template(
    '<div class="<%= story_type %> card" id="back-<%= cardno %>">' +
    ' <div class="back side">' +
    '   <div class="header">' +
    '     <span class="project"><%= project_name %></span>' +
    '     <span class="id"><%= id %></span>' +
    '   </div>' +
    '   <div class="middle">' +
    '     <div class="story-title"><%= name %></div>' +
    '     <div class="description"><%= description %></div>' +
    '     <table class="tasks">' +
    '<% _.each(tasks, function(task) { %><tr>' +
    '     <td class="check <%= task._complete ? "complete" : "incomplete" %>"><%= task._complete ? "☑" : "☐" %></td>' +
    '     <td class="task"><%= task._description %></td>' +
    '</tr><% }); %>' +
    '     </table>' +
    '   </div>' +
    '   <div class="footer">' +
    '     <% if (requester) { %><span class="requester"><%= requester %></span><% } %>' +
    '     <% if (owner) { %><span class="owner"><%= owner %></span><% } %>' +
    '   </div>' +
    ' </div>' +
    '</div>');

  /*
   *  overlay with printable pages
   *
   *  TBD: really should make a dismissable overlay
   */
  $('body > *').hide();
  var main = $('<div id="pivotal-cards-pages"></div>');
  _.each(options, function(value, option) {
    if (value) {
      main.addClass(option);
    }
  });
  $('body').append(main);

  /*
   *  Find visible items
   */
  var items = $('.item:has(.selected)'); // use the selected items
    if (items.length == 0) { // if there are no selected items ...
    items = $('.item'); // ... then use all items
  }
  var story_ids = _.uniq(items.map(function() {
    var match = this.className.match(/story_([0-9]+)/);
    return match ? match[1] : '';
  }));

  /*
   *  build cards
   */
  var build_cards = function() {
    var cardno = 0;
    var fronts = [];
    var backs = [];
    var markdown = Markdown.getSanitizingConverter();
    var project = tracker.Project.current();

    _.each(story_ids, function (id) {
      var matches = id.split("_");
      var item;
      var card;

      var story = project.stories().get(id);

      if (story) {

        var requester = project.members().get(story.get('requested_by_id'));
        var owner = project.members().get(story.get('owned_by_id'));

        item = {
          cardno: cardno,
          story_type: story.get('story_type'),
          id: id,
          name: story.get('name').replace(/\band\b|&/g, '<span class="amp">&amp;</span>'),
          epic_name: '',
          tasks: [],
          description: markdown.makeHtml(story.get('description')) || "",
          project_name: project.get('name'),
          labels: story.get('labels'),
          requester: requester ? requester.get('name') : '',
          owner: owner ? owner.get('name') : '',
          points: story.get('estimate') > 0 ? story.get('estimate') : ""
        };

        if (item.story_type === "chore" && item.name.match(/\?\s*$/)) {
          item.story_type = "spike";
        }

        /*
         *  make cards using templates
         */
        card = make_front(item);
        fronts.push($(card));

        card = make_back(item);
        backs.push($(card));

        cardno++;
      }
    });

    /*
     *  layout cards
     */
    function double_sided() {
      var cardno;
      var front_page;
      var back_page;

      for (cardno = 0; cardno < fronts.length; cardno++) {
        if ((cardno % 4) === 0) {
          front_page = $('<div class="page fronts"></div>');
          main.append(front_page);

          back_page = $('<div class="page backs"></div>');
          main.append(back_page);
        }
        front_page.append(fronts[cardno]);
        back_page.append(backs[cardno]);

        /*
        if (!(cardno % 2)) {
        } else {
          $(back_page).children().last().before(backs[cardno]);
        }
        */
      }
    }

    function single_sided() {
      var cardno;
      var page;

      for (cardno = 0; cardno < fronts.length; cardno++) {
        if ((cardno % 2) === 0) {
          page = $('<div class="page"></div>');
          main.append(page);
        }
        page.append(fronts[cardno]);
        page.append(backs[cardno]);
      }
    }


    if (options['double-sided']) {
      double_sided();
    } else {
      single_sided();
    }

  };

  $.getScript(
    '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Converter.js',
    function() {
      $.getScript(
        '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Sanitizer.js',
        build_cards
      );
    }
  );

}(jQuery));
