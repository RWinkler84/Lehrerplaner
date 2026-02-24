// version 1.2

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResources(event.request))
});

self.addEventListener('install', (event) => { event.waitUntil(cacheMinimalData()) });
self.addEventListener('message', async (event) => {
    if (event.data == 'skip waiting') self.skipWaiting();

    //refresh all tabs after activation
    const tabs = await self.clients.matchAll({ type: 'window' })
    tabs.forEach((tab) => {
        tab.navigate(tab.url)
    })
})


async function fetchResources(request) {
    const responseFromCache = await caches.match(request);

    return responseFromCache || fetch(request);
}

async function cacheMinimalData() {
    const minimalResources = [
        './',

        //css
        './css/animations.css',
        './css/curriculum.css',
        './css/editor.css',
        './css/index.css',

        //controller
        './js/Controller/AbstractController.js',
        './js/Controller/CurriculumController.js',
        './js/Controller/LessonController.js',
        './js/Controller/LessonNoteController.js',
        './js/Controller/LoginController.js',
        './js/Controller/SchoolYearController.js',
        './js/Controller/SettingsController.js',
        './js/Controller/TaskController.js',
        './js/Controller/TimetableController.js',

        //model
        './js/Model/AbstractModel.js',
        './js/Model/Lesson.js',
        './js/Model/LessonNote.js',
        './js/Model/Login.js',
        './js/Model/SchoolYear.js',
        './js/Model/Settings.js',
        './js/Model/Task.js',

        //view
        './js/View/AbstractView.js',
        './js/View/CurriculumView.js',
        './js/View/LessonNoteView.js',
        './js/View/LessonView.js',
        './js/View/LoginView.js',
        './js/View/SchoolYearView.js',
        './js/View/SettingsView.js',
        './js/View/TaskView.js',
        './js/View/TimetableView.js',

        //misc
        './js/inc/editor.js',
        './js/inc/utils.js',
        './js/index.js',
    ];

    const cache = await caches.open('eduplanio');

    for (const url of minimalResources) {
        const response = await fetch(url, { cache: 'reload' });
        cache.put(url, response);
    }
}