$(document).ready(function () {
    const apiUrl = '/api/courses';
    const logsApiUrl = '/api/logs';
    const courseSelect = $('#course');
    const newCourseName = $('#newCourseName');
    const saveCourseBtn = $('#saveCourseBtn');
    const uofuIdInput = $('#uofuId');
    const logsContainer = $('ul[data-cy="logs"]');
    const logTextarea = $('#logTextarea');
    const addLogButton = $('button[type="submit"]');
    const uofuIdDisplay = $('#uofuIdDisplay');
    const newLogContainer = $('#newLogContainer');
    const uofuIdContainer = $('#uofuIdContainer');

    // Load courses
    function loadCourses() {
        $.get(apiUrl, (courses) => {
            courseSelect.empty();
            courseSelect.append('<option value="" disabled selected>Select a course</option>');
            courses.forEach((course) => {
                if (course.tenant === 'UofU') {
                    courseSelect.append(`<option value="${course._id}">${course.display}</option>`);
                }
            });
        }).fail((err) => {
            console.error('Failed to load courses:', err);
        });
    }

    // Load logs
    function fetchLogs(uofuId, courseId) {
        $.get(`/api/logs?courseId=${courseId}&uvuId=${uofuId}`, (logs) => {
            logsContainer.empty(); // Clear previous logs
            uofuIdDisplay.text(`Student Logs for ${uofuId}`).show();
            logsContainer.show();

            if (logs.length > 0) {
                logs.forEach((log) => {
                    const logItem = $('<li></li>')
                        .addClass('list-group-item')
                        .css('cursor', 'pointer')
                        .html(`
                            <div>
                                <p>${log.text}</p>
                                <small class="text-muted">${log.date}</small>
                            </div>
                        `);
                    logItem.on('click', function () {
                        $(this).find('p').toggle();
                    });
                    logsContainer.append(logItem); // Append each log to the container
                });
                newLogContainer.show();
            } else {
                logsContainer.html('<li class="list-group-item">No logs found for this UofU ID and course. You can add a new log below.</li>');
                newLogContainer.show();
            }
            updateAddLogButtonState();
        }).fail((error) => {
            logsContainer.html('<li class="list-group-item text-danger">Error loading logs. Please try again.</li>');
            console.error('Error fetching logs:', error);
        });
    }

    // Save new course
    saveCourseBtn.on('click', function () {
        const newCourse = newCourseName.val().trim();
        if (newCourse) {
            $.post(apiUrl, { display: newCourse, tenant: 'UofU' }, () => {
                newCourseName.val('');
                saveCourseBtn.prop('disabled', true);
                loadCourses();
            }).fail((err) => {
                console.error('Failed to save course:', err);
            });
        }
    });

    // Enable add course button
    newCourseName.on('input', function () {
        saveCourseBtn.prop('disabled', $(this).val().trim() === '');
    });

    // Handle course selection
    courseSelect.on('change', function () {
        const selectedCourse = $(this).val();
        const uofuId = uofuIdInput.val().trim();
        if (uofuId && selectedCourse) {
            fetchLogs(uofuId, selectedCourse);
        }
        uofuIdContainer.show();
        updateAddLogButtonState();
    });

    // Handle UofU ID input
    uofuIdInput.on('input', function () {
        const uofuId = $(this).val().trim();
        const selectedCourse = courseSelect.val();
        if (uofuId.length === 8 && selectedCourse) {
            fetchLogs(uofuId, selectedCourse);
        }
        updateAddLogButtonState();
    });

    // Handle log textarea input
    logTextarea.on('input', function () {
        updateAddLogButtonState();
    });

    // Enable or disable the Add Log button based on input states
    function updateAddLogButtonState() {
        const logText = logTextarea.val().trim();
        const uofuId = uofuIdInput.val().trim();
        const courseId = courseSelect.val();
        const isButtonEnabled = logText && uofuId.length === 8 && courseId;
        addLogButton.prop('disabled', !isButtonEnabled);
    }

    // Add log
    $('form').on('submit', function (e) {
        e.preventDefault();
        const logText = logTextarea.val().trim();
        const uofuId = uofuIdInput.val().trim();
        const courseId = courseSelect.val();
        if (logText && uofuId && courseId) {
            $.post(
                logsApiUrl,
                { text: logText, uvuId: uofuId, courseId, date: new Date().toLocaleString() },
                () => {
                    logTextarea.val('');
                    fetchLogs(uofuId, courseId);
                }
            ).fail((err) => {
                console.error('Failed to add log:', err);
            });
        }
    });

    loadCourses();
});
