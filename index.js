// make this global to stop it getting every time the function is called (performance hit)
const carousel = document.getElementById("carousel-wrapper");
const teamWrapper = document.getElementById("team-cards");
const featWrapper = document.getElementById("features");
const socialTemplate = document.getElementById("tpl-social").innerHTML;
const placeholderTemplate = document.getElementById("tpl-placeholder").innerHTML;
const featureTemplate = document.getElementById("tpl-feat").innerHTML;
const featureListTemplate = document.getElementById("tpl-featls").innerHTML;
const template = document.getElementById("tpl-card").innerHTML;

const carouselState = {
  paused: false,
  dragging: false,
  mouseX: 0,
  startingMouseX: 0,
  lastDragged: 0,
  velocity: 0
};
let scrollerWidth = 0;

function injectFeats(config) {
  config.forEach((list) => {
    let entries = "";
    list.items.forEach((item) => {
      entries = entries
        .concat(featureTemplate
          .replace("@icon", item.icon ?? "assets/icons/github.svg")
          .replace("@topic", item.name)
          .replace("@desc", item.desc)
        )
    })
    featWrapper.innerHTML = featWrapper.innerHTML
      .concat(featureListTemplate
        .replace("@title", list.name)
        .replace("@list", entries)
      )
  })
}

function injectProfiles(config) {
  config.forEach((user) => {
    let card = template
      .replace("@name", user.name)
      .replace("@role", user.role)
      .replace("@pfp", user.pfp)
      .replace("@platform", user.socials.main.name)
      .replace("@link", user.socials.main.link);

    const socials = user.socials.alts
    let n = 0;
    for (let i = 0; i < socials.length; i++) {
      card = card.replace("@social" + n, socialTemplate
        .replace("@platform", socials[i].name)
        .replace("@link", socials[i].link)
        .replace("@icon", socials[i].icon)
      );
      n++;
    }
    for (let i = n; i < 3; i++) {
      card = card.replace("@social" + n, placeholderTemplate);
      n++;
    }
    teamWrapper.innerHTML = teamWrapper.innerHTML.concat(card);
  })
}


// The code for generating the profile pictures in the scrolly thing 

function injectCarousel(config) {
  const channels = carousel.children;
  const template = document.getElementById("tpl-contributor").innerHTML;

  let output = "";
  config.forEach((user) => {
    let item = template
      .replace("@name", user.name)
      .replace("@link", user.link)
      .replace("@pfp", user.pfp);

    output += item;
  });
  channels[0].innerHTML = output;
  channels[1].innerHTML = output; // duplicate for infinite scroll

  // detect hover for pausing and unpausing
  carousel.onmouseenter = () => {
    if (!carouselState.dragging)
      carouselState.paused = true;
  }

  carousel.onmouseleave = () => {
    carouselState.paused = false;
    carouselState.lastDragged = Date.now();
  }

  carousel.onmousedown = (event) => {
    carousel.style.cursor = "grabbing"
    carouselState.dragging = true;
    carouselState.paused = true;
    carouselState.mouseX = event.clientX;
    carouselState.startingMouseX = 0;
    carouselState.velocity = 0;
  }

  window.onmouseup = () => {
    carousel.style.cursor = "grab"
    if (carouselState.dragging) carouselState.lastDragged = Date.now();
    carouselState.dragging = false;
    carouselState.mouseX = 0;
    carouselState.startingMouseX = 0;
  }
}

let offset = 0;

function handleOffset() {
  scrollerWidth = carousel.children[0].offsetWidth + 16;
  if (offset <= -scrollerWidth) {
    offset += scrollerWidth;
  } else if (offset >= 0) {
    offset -= scrollerWidth;
  }
  carousel.style.left = offset + "px";
}
// The code that's supposed to make it scroll (it's a lot better at it's job now :3)
async function loopCarousel() {
  const MS_TO_REGEN = 300; // how long it takes to get back to its original speed
  let offsetBy = carouselState.velocity / -1;
  if (!carouselState.dragging && !carouselState.paused) {
    const difference = Date.now() - carouselState.lastDragged;
    offsetBy += Math.min(Math.max(0, difference / MS_TO_REGEN), 1)
  }

  offset -= offsetBy;
  carouselState.velocity *= 0.95; // friction
  handleOffset();

  requestAnimationFrame(loopCarousel);
}

window.onload = async () => {
  document.onmousemove = (event) => {
    if (carouselState.dragging) {
      const difference = (event.clientX - carouselState.mouseX);
      if (difference === 0) return; // no change
      offset += difference;
      carouselState.velocity = difference;
      if (carouselState.velocity > 100) carouselState.velocity = 100;
      if (carouselState.velocity < -100) carouselState.velocity = -100;
      // clamp it because it can be negative

      carouselState.mouseX = event.clientX;
      handleOffset();
    }
  }

  fetch("config/rotur-team.json")
    .then(response => response.json())
    .then(data => injectProfiles(data));
  fetch("config/contributors.json")
    .then(response => response.json())
    .then(data => injectCarousel(data));
  fetch("config/features.json")
    .then(response => response.json())
    .then(data => injectFeats(data));

  requestAnimationFrame(loopCarousel); // makes it scroll to the side
}