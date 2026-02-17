self.addEventListener('fetch', (event) => {
    event.respondWith(fetchResources(event.request, event))
});

self.addEventListener('install', (event) => {event.waitUntil(cacheMinimalData())});


async function fetchResources(request, event) {
    try {
        let responseFromNetwork = await fetch(request, { signal: AbortSignal.timeout(1000) });
        event.waitUntil(cacheResources(request, responseFromNetwork.clone()));

        return responseFromNetwork;
    }
    catch {
        const responseFromCache = await getCachedResources(request);
        return responseFromCache;
    }
}


async function cacheResources(request, dataToCache) {
    if (request.method == 'POST') return;

    const cache = await caches.open('eduplanio')

    if (cache) {
        await cache.delete(request);
        await cache.put(request, dataToCache)
    }
}

async function getCachedResources(request) {
    return await caches.match(request);
}

async function cacheMinimalData() {
    const cache = await caches.open('eduplanio');

    if (cache) {
        cache.addAll(
            [
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
            ]
        );
    }
}




































