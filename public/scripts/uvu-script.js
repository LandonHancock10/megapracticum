$(document).ready(function () {
    const apiUrl = '/api/courses';
    const logsApiUrl = '/api/logs';
    const courseSelect = $('#course');
    const newCourseName = $('#newCourseName');
    const saveCourseBtn = $('#saveCourseBtn');
    const uvuIdInput = $('#uvuId');
    const logsContainer = $('ul[data-cy="logs"]');
    const logTextarea = $('#logTextarea');
    const addLogButton = $('button[type="submit"]');
    const uvuIdDisplay = $('#uvuIdDisplay');
    const newLogContainer = $('#newLogContainer');
    const uvuIdContainer = $('#uvuIdContainer');

    // Load courses
    function loadCourses() {
        $.get(apiUrl, (courses) => {
            courseSelect.empty();
            courseSelect.append('<option value="" disabled selected>Select a course</option>');
            courses.forEach((course) => {
                courseSelect.append(`<option value="${course._id}">${course.display}</option>`);
            });
        }).fail((err) => {
            console.error('Failed to load courses:', err);
        });
    }

    // Load logs
    function fetchLogs(uvuId, courseId) {
        $.get(`/api/logs?courseId=${courseId}&uvuId=${uvuId}`, (logs) => {
            logsContainer.empty(); // Clear previous logs
            uvuIdDisplay.text(`Student Logs for ${uvuId}`).show();
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
                logsContainer.html('<li class="list-group-item">No logs found for this UVU ID and course. You can add a new log below.</li>');
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
            $.post(apiUrl, { display: newCourse }, () => {
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
        const uvuId = uvuIdInput.val().trim();
        if (uvuId && selectedCourse) {
            fetchLogs(uvuId, selectedCourse);
        }
        uvuIdContainer.show();
        updateAddLogButtonState();
    });

    // Handle UVU ID input
    uvuIdInput.on('input', function () {
        const uvuId = $(this).val().trim();
        const selectedCourse = courseSelect.val();
        if (uvuId.length === 8 && selectedCourse) {
            fetchLogs(uvuId, selectedCourse);
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
        const uvuId = uvuIdInput.val().trim();
        const courseId = courseSelect.val();
        const isButtonEnabled = logText && uvuId.length === 8 && courseId;
        addLogButton.prop('disabled', !isButtonEnabled);
    }

    // Add log
    $('form').on('submit', function (e) {
        e.preventDefault();
        const logText = logTextarea.val().trim();
        const uvuId = uvuIdInput.val().trim();
        const courseId = courseSelect.val();
        if (logText && uvuId && courseId) {
            $.post(
                logsApiUrl,
                { text: logText, uvuId, courseId, date: new Date().toLocaleString() },
                () => {
                    logTextarea.val('');
                    fetchLogs(uvuId, courseId);
                }
            ).fail((err) => {
                console.error('Failed to add log:', err);
            });
        }
    });

    loadCourses();
});
