const state = {
  projects: [],
  filteredProjects: [],
  currentFilter: 'all',
  isMenuOpen: false,
};

const selectors = {
  header: document.querySelector('[data-header]'),
  menu: document.querySelector('[data-menu]'),
  menuToggle: document.querySelector('[data-menu-toggle]'),
  themeToggle: document.querySelector('[data-theme-toggle]'),
  topButton: document.querySelector('[data-top-button]'),
  projectSection: document.querySelector('[data-github-username]'),
  projectList: document.querySelector('[data-project-list]'),
  projectStatus: document.querySelector('[data-project-status]'),
  filterGroup: document.querySelector('[data-filter-group]'),
  retryProjects: document.querySelector('[data-retry-projects]'),
  contactForm: document.querySelector('[data-contact-form]'),
  formSuccess: document.querySelector('[data-form-success]'),
  currentYear: document.querySelector('[data-current-year]'),
  typing: document.querySelector('[data-typing]'),
};

const PROJECT_CACHE_KEY = 'portfolioProjectsCache';
const FALLBACK_PROJECTS = [
  {
    id: 'fallback-portfolio',
    name: 'Responsive Portfolio',
    description: 'HTML, CSS, JavaScript로 만든 반응형 개인 포트폴리오 웹사이트입니다.',
    html_url: '#hero',
    language: 'JavaScript',
    stargazers_count: 0,
    forks_count: 0,
  },
  {
    id: 'fallback-form-validation',
    name: 'Contact Form UX',
    description: '필수값, 이메일 형식, 필드별 에러 메시지를 제공하는 문의 폼 UX 예제입니다.',
    html_url: '#contact',
    language: 'HTML',
    stargazers_count: 0,
    forks_count: 0,
  },
  {
    id: 'fallback-theme-system',
    name: 'Theme & Scroll Interactions',
    description: '로컬스토리지 다크 모드, 시스템 테마 감지, 스크롤 기반 UI를 구현한 인터랙션 모음입니다.',
    html_url: '#skills',
    language: 'CSS',
    stargazers_count: 0,
    forks_count: 0,
  },
];

const setMenuState = (isOpen) => {
  state.isMenuOpen = isOpen;
  selectors.menu.classList.toggle('is-open', isOpen);
  selectors.menuToggle.setAttribute('aria-expanded', String(isOpen));
  selectors.menuToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
};

const updateScrollUi = () => {
  const scrollY = window.scrollY;
  selectors.header.classList.toggle('is-scrolled', scrollY >= 60);
  selectors.topButton.classList.toggle('is-visible', scrollY >= 300);
};

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  selectors.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  selectors.themeToggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
};

const toggleTheme = () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', nextTheme);
  applyTheme(nextTheme);
};

const setupRevealAnimation = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
};

const typeHeroText = () => {
  const phrases = ['프론트엔드 개발자', '문제를 해결하는 사람', '꾸준히 성장하는 동료'];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const tick = () => {
    const currentPhrase = phrases[phraseIndex];
    selectors.typing.textContent = currentPhrase.slice(0, charIndex);

    if (!isDeleting && charIndex < currentPhrase.length) {
      charIndex += 1;
      setTimeout(tick, 110);
      return;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      setTimeout(tick, 1300);
      return;
    }

    if (isDeleting && charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 55);
      return;
    }

    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(tick, 250);
  };

  tick();
};

const renderStatus = (message) => {
  selectors.projectStatus.textContent = message;
};

const createProjectCard = ({ name, description, html_url: htmlUrl, language, stargazers_count: stars, forks_count: forks }) => {
  const card = document.createElement('article');
  const title = document.createElement('h3');
  const link = document.createElement('a');
  const summary = document.createElement('p');
  const meta = document.createElement('div');
  const metaItems = [language || '기타', `★ ${stars}`, `⑂ ${forks}`];

  card.className = 'project-card';
  link.href = htmlUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = name;
  title.append(link);
  summary.textContent = description || '설명이 준비 중인 프로젝트입니다.';
  meta.className = 'project-card__meta';
  meta.append(...metaItems.map((item) => {
    const span = document.createElement('span');
    span.textContent = item;
    return span;
  }));
  card.append(title, summary, meta);
  return card;
};

const renderProjects = () => {
  selectors.projectList.replaceChildren();

  if (state.filteredProjects.length === 0) {
    renderStatus('표시할 프로젝트가 없습니다');
    return;
  }

  const cards = state.filteredProjects.map(createProjectCard);
  selectors.projectList.append(...cards);
  renderStatus(`${state.filteredProjects.length}개의 프로젝트를 표시하고 있습니다.`);
};

const applyProjectFilter = (filter) => {
  state.currentFilter = filter;
  state.filteredProjects = filter === 'all'
    ? state.projects
    : state.projects.filter(({ language }) => (language || '기타') === filter);

  selectors.filterGroup.querySelectorAll('.filter-button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === filter);
  });
  renderProjects();
};

const renderFilters = () => {
  const languages = [...new Set(state.projects.map(({ language }) => language || '기타'))].sort();
  const buttons = languages.map((language) => {
    const button = document.createElement('button');
    button.className = 'filter-button';
    button.type = 'button';
    button.dataset.filter = language;
    button.textContent = language;
    return button;
  });

  selectors.filterGroup.querySelector('[data-filter="all"]').classList.add('is-active');
  selectors.filterGroup.querySelectorAll('[data-filter]:not([data-filter="all"])').forEach((button) => button.remove());
  selectors.filterGroup.append(...buttons);
};

const normalizeProjects = (repos) => repos
  .filter(({ fork }) => !fork)
  .map(({ id, name, description, html_url, language, stargazers_count, forks_count }) => ({
    id,
    name,
    description,
    html_url,
    language,
    stargazers_count,
    forks_count,
  }));

const cacheProjects = (projects) => {
  if (projects.length > 0) {
    localStorage.setItem(PROJECT_CACHE_KEY, JSON.stringify(projects));
  }
};

const getCachedProjects = () => {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_CACHE_KEY)) || [];
  } catch {
    localStorage.removeItem(PROJECT_CACHE_KEY);
    return [];
  }
};

const setProjects = (projects, statusMessage) => {
  state.projects = projects;
  renderFilters();
  applyProjectFilter('all');

  if (statusMessage) {
    renderStatus(statusMessage);
  }
};

const getProjectFallback = (error) => {
  const cachedProjects = getCachedProjects();

  if (cachedProjects.length > 0) {
    return {
      projects: cachedProjects,
      message: `${error.message} 저장된 프로젝트를 대신 표시합니다.`,
    };
  }

  return {
    projects: FALLBACK_PROJECTS,
    message: `${error.message} 샘플 프로젝트를 대신 표시합니다.`,
  };
};

const fetchProjects = async () => {
  const username = selectors.projectSection.dataset.githubUsername;
  const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=12`;
  renderStatus('로딩 중...');
  selectors.projectList.replaceChildren();

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (response.status === 403) {
      throw new Error('GitHub API 요청 제한에 도달했습니다.');
    }

    if (!response.ok) {
      throw new Error('프로젝트를 불러올 수 없습니다.');
    }

    const repos = await response.json();
    const projects = normalizeProjects(repos);
    cacheProjects(projects);
    setProjects(projects);
  } catch (error) {
    const { projects, message } = getProjectFallback(error);
    setProjects(projects, message);
  }
};

const setFieldError = (field, message) => {
  const errorElement = document.querySelector(`#${field.id}-error`);
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  field.setAttribute('aria-describedby', errorElement.id);
  errorElement.textContent = message;
};

const validateContactForm = () => {
  const formData = new FormData(selectors.contactForm);
  const values = Object.fromEntries(formData.entries());
  const fields = {
    name: selectors.contactForm.elements.name,
    email: selectors.contactForm.elements.email,
    message: selectors.contactForm.elements.message,
  };
  const errors = {
    name: values.name.trim() ? '' : '이름을 입력해 주세요.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? '' : '올바른 이메일 형식으로 입력해 주세요.',
    message: values.message.trim() ? '' : '메시지를 입력해 주세요.',
  };

  Object.entries(fields).forEach(([key, field]) => setFieldError(field, errors[key]));
  return Object.values(errors).every((message) => message === '');
};

const handleFormSubmit = (event) => {
  event.preventDefault();
  selectors.formSuccess.textContent = '';

  if (!validateContactForm()) {
    return;
  }

  selectors.contactForm.reset();
  selectors.formSuccess.textContent = '메시지가 성공적으로 제출되었습니다. 빠르게 확인하겠습니다!';
};

const bindEvents = () => {
  selectors.menuToggle.addEventListener('click', () => setMenuState(!state.isMenuOpen));
  selectors.themeToggle.addEventListener('click', toggleTheme);
  selectors.topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  selectors.retryProjects.addEventListener('click', fetchProjects);
  selectors.contactForm.addEventListener('submit', handleFormSubmit);
  window.addEventListener('scroll', updateScrollUi, { passive: true });

  selectors.menu.addEventListener('click', (event) => {
    if (event.target.matches('a')) {
      setMenuState(false);
    }
  });

  selectors.filterGroup.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (button) {
      applyProjectFilter(button.dataset.filter);
    }
  });
};

const init = () => {
  selectors.currentYear.textContent = new Date().getFullYear();
  applyTheme(getInitialTheme());
  bindEvents();
  updateScrollUi();
  setupRevealAnimation();
  typeHeroText();
  fetchProjects();
};

init();
