!(function (window, $, _, tracker, undefined) {

    'use strict';

    var frontTpl = _.template(
        '<div class="<%= storyType %> card" id="front-<%= cardno %>">' +
        ' <div class="front side">' +
        '   <div class="header">' +
        '     <span class="labels">' +
        '<% _.each(labels, function(label) { %> <span class="label"><%= label %></span> <% }); %>' +
        '     <span>' +
        '   </div>' +
        '   <div class="middle">' +
        '     <div class="story-title"><%= name %></div>' +
        '     <div class="story-type"><%= storyType %></div>' +
        '   </div>' +
        '   <div class="footer">' +
        '     <span class="epic_name"><%= epicName %></span>' +
        '     <span class="points points<%= points %>"><span><%= points %></span></span>' +
        '   </div>' +
        ' </div>' +
        '</div>');

    var backTpl = _.template(
        '<div class="<%= storyType %> card" id="back-<%= cardno %>">' +
        ' <div class="back side">' +
        '   <div class="header">' +
        '     <span class="project"><%= projectName %></span>' +
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

    function buildCards($el, items, project, markdown) {
        var frontPage, backPage, item;

        _.each(_.uniq(_.map(items, function(item) {
            return item.className.match(/story_([0-9]+)/)[1];
        })), function (id, cardno) {
            item = (function(id, story) {
                return {
                    'cardno':       cardno,
                    'storyType':    getType(story),
                    'id':           id,
                    'name':         story.get('name'),
                    'epicName':     '',
                    'tasks':        [],
                    'description':  getDescription(story, markdown),
                    'projectName':  project.get('name'),
                    'labels':       getLabels(story),
                    'requester':    getRequester(project, story),
                    'owner':        getOwner(project, story),
                    'points':       getEstimate(story)
                };
            }(id, project.stories().get(id)));

            if ((cardno % 4) === 0) {
                frontPage = $('<div class="page fronts"/>');
                $el.append(frontPage);
                backPage = $('<div class="page backs"/>');
                $el.append(backPage);
            }
            frontPage.append(frontTpl(item));
            backPage.append(backTpl(item));
        });


        function getLabels(story) {
            return _.map(story.get('label_ids'), function (id) {
                return project.labels().get(id).get('name');
            });
        }

        function getRequester(project, story) {
            return getUsername(project, story.get('requested_by_id'));
        }

        function getOwner(project, story) {
            return getUsername(project, story.get('owned_by_id'));
        }

        function getUsername(project, id) {
            var user = project.members().get(id);
            return user ? user.get('name') : '';
        }

        function getDescription(story, markdown) {
            return markdown.makeHtml(story.get('description')) || '';
        }

        function getEstimate(story) {
            return story.get('estimate') > 0 ? story.get('estimate') : (
                getType(story) === 'feature' ? '?': ''
            );
        }

        function getType(story) {
            var type = story.get('story_type');
            if (type === 'chore' && story.get('name').match(/\?\s*$/)) {
                type = 'spike';
            }
            return type;
        }

    }

    $.getScript(
        '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Converter.js',
        function() {
            $.getScript(
                '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Sanitizer.js',
                function() {
                    var $body = $('body');
                    $body.find('>*').hide();
                    buildCards(
                        $('<div id="pivotal-cards-pages" class="rubber-stamp filing-colours white-backs double-sided"/>').appendTo($body),
                        $('.item:has(.selected)'),
                        tracker.Project.current(),
                        window.Markdown.getSanitizingConverter()
                    );
                }
            );
        }
    );

}(window, window.jQuery, window._, window.tracker));
