import $ from 'jquery';
const tracker = window.tracker;

function frontTpl (item) {
  return `
      <div class="${item.storyType} card" id="front-${item.cardno}">
        <div class="front side">
          <div class="header">
            <span class="severity">
              ${severityTpl(item.severity)}
            </span>
            <span class="labels">
              ${labelTpl(item.labels)}
           <span>
         </div>
         <div class="middle">
           <div class="story-title">${item.name}</div>
           <div class="story-type">${item.storyType}</div>
         </div>
         <div class="footer">
           <span class="epic_name">${item.epicName}</span>
           <span class="points points${item.points}"><span>${item.points}</span></span>
         </div>
       </div>
      </div>`;
}

function labelTpl (labels) {
  return labels.reduce((acc, label) => acc + `<span class="label">${label}</span>`, '');
}

function backTpl (item) {
  return `
      <div class="${item.storyType} card" id="back-${item.cardno}">
        <div class="back side">
          <div class="header">
            <span class="project">${item.projectName}</span>
            <span class="id">${item.id}</span>
          </div>
          <div class="middle">
            <div class="story-title">${item.name}</div>
            <div class="description">${item.description}</div>
         </div>
         <div class="footer">
           ${requesterTpl(item.requester)}
           ${ownerTpl(item.owner)}
         </div>
       </div>
      </div>
    `;
}

function requesterTpl (requester) {
  return undefined === requester ? '' : `<span class="requester">${requester}</span>`;
}

function ownerTpl (owner) {
  return undefined === owner ? '' : `<span class="owner">${owner}</span>`;
}

function severityTpl (severity) {
  return undefined === severity ? '' : `<span class="sev${severity}">${severity}</span>`;
}

function buildCards ($el, items, project, markdown) {
  let frontPage, backPage, item;

  items.map(item => item.className.match(/story_([0-9]+)/)[1])
    .filter((val, i, self) => self.indexOf(val) === i)
    .map(function (id, cardno) {
      item = (function (id, story) {
        return {
          'cardno': cardno,
          'storyType': getType(story),
          'id': id,
          'name': story.get('name'),
          'epicName': '',
          'tasks': [],
          'description': getDescription(story, markdown),
          'projectName': project.get('name'),
          'labels': getLabels(story),
          'requester': getRequester(project, story),
          'owner': getOwner(project, story),
          'points': getEstimate(story),
          'severity': getSeverity(story)
        };
      }(id, project.stories().get(id)));

      if ((cardno % 4) === 0) {
        frontPage = $('<div class="page fronts"/>').appendTo($el);
        backPage = $('<div class="page backs"/>').appendTo($el);
      }
      frontPage.append(frontTpl(item));
      backPage.append(backTpl(item));
    });

  function getLabels (story) {
    return story.get('label_ids').map((id) => project.labels().get(id).get('name'));
  }

  function getRequester (project, story) {
    return getUsername(project, story.get('requested_by_id'));
  }

  function getOwner (project, story) {
    return getUsername(project, story.get('owned_by_id'));
  }

  function getUsername (project, id) {
    const user = project.members().get(id);
    return user ? user.get('name') : '';
  }

  function getDescription (story, markdown) {
    return markdown.makeHtml(story.get('description')) || '';
  }

  function getSeverity (story) {
    return (getLabels(story).join(',').match(/sev([\d])/) || []).pop();
  }

  function getEstimate (story) {
    return story.get('estimate') > 0 ? story.get('estimate') : (
      getType(story) === 'feature' ? '?' : ''
    );
  }

  function getType (story) {
    let type = story.get('story_type');
    if (type === 'chore' && story.get('name').match(/\?\s*$/)) {
      type = 'spike';
    }
    return type;
  }
}

$.getScript(
  '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Converter.js',
  function () {
    $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/pagedown/1.0/Markdown.Sanitizer.js',
      function () {
        window.pivotalCards = function () {
          const $body = $('body');
          const $cards = $('#pivotal-cards-pages');
          const $root = $('#root');
          if ($cards.length > 0) {
            $cards.remove();
            $root.show();
          } else {
            $root.hide();
            buildCards(
              $('<div id="pivotal-cards-pages" class="rubber-stamp filing-colours white-backs double-sided"/>').appendTo($body),
              $('.item:has(.selected)').get(),
              tracker.Project.current(),
              window.Markdown.getSanitizingConverter()
            );
          }
        };
        window.pivotalCards();
      }
    );
  }
);
