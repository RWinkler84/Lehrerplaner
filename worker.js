const version = '0.9.110626';

self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResources(event.request))
});

self.addEventListener('install', (event) => {
    event.waitUntil(cacheMinimalData())
});

self.addEventListener('message', async (event) => {
    if (event.data == 'skip waiting') self.skipWaiting();

    await removeOldCaches();

    //refresh all tabs after activation
    const tabs = await self.clients.matchAll({ type: 'window' })
    tabs.forEach((tab) => {
        tab.navigate(tab.url)
    })
})

self.addEventListener('activate', async (event) => { event.waitUntil(removeOldCaches()) });



async function fetchResources(request) {
    const cache = await caches.open(`eduplanio_${version}`);
    const responseFromCache = await cache.match(request);

    return responseFromCache || fetch(request);
}

async function removeOldCaches() {
    let cacheNames = await caches.keys();
    for (cache of cacheNames) {
        if (!cache.includes('eduplanio')) continue;
        if (cache == `eduplanio_${version}`) continue;
        await caches.delete(cache);
    }
}

async function cacheMinimalData() {
    const minimalResources = [
        `./?v=${version}`,

        //css
        `./css/animations.css?v=${version}`,
        `./css/curriculum.css?v=${version}`,
        `./css/editor.css?v=${version}`,
        `./css/index.css?v=${version}`,

        //controller
        `./js/Controller/AbstractController.js?v=${version}`,
        `./js/Controller/CurriculumController.js?v=${version}`,
        `./js/Controller/LessonController.js?v=${version}`,
        `./js/Controller/LessonNoteController.js?v=${version}`,
        `./js/Controller/LoginController.js?v=${version}`,
        `./js/Controller/SchoolYearController.js?v=${version}`,
        `./js/Controller/SettingsController.js?v=${version}`,
        `./js/Controller/TaskController.js?v=${version}`,
        `./js/Controller/TimetableController.js?v=${version}`,
        `./js/Controller/YearNoteController.js?v=${version}`,

        //model
        `./js/Model/AbstractModel.js?v=${version}`,
        `./js/Model/Lesson.js?v=${version}`,
        `./js/Model/LessonNote.js?v=${version}`,
        `./js/Model/Login.js?v=${version}`,
        `./js/Model/SchoolYear.js?v=${version}`,
        `./js/Model/Settings.js?v=${version}`,
        `./js/Model/Task.js?v=${version}`,
        `./js/Model/YearNote.js?v=${version}`,

        //view
        `./js/View/AbstractView.js?v=${version}`,
        `./js/View/CurriculumView.js?v=${version}`,
        `./js/View/LessonNoteView.js?v=${version}`,
        `./js/View/LessonView.js?v=${version}`,
        `./js/View/LoginView.js?v=${version}`,
        `./js/View/SchoolYearView.js?v=${version}`,
        `./js/View/SettingsView.js?v=${version}`,
        `./js/View/TaskView.js?v=${version}`,
        `./js/View/TimetableView.js?v=${version}`,
        `./js/View/YearNoteView.js?v=${version}`,

        //misc
        `./js/inc/editor.js?v=${version}`,
        `./js/inc/utils.js?v=${version}`,
        `./js/index.js?v=${version}`,
    ];

    const cache = await caches.open('eduplanio_' + version);

    for (const url of minimalResources) {
        const response = await fetch(url, { cache: 'reload' });
        let shortenedUrl = url.split('?')[0];
        cache.put(shortenedUrl, response);
    }
}