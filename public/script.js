const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    fetchAndDisplayBooks();
    
    // Setup form submissions for all tables
    setupFormSubmission('add-branch-form', `${API_URL}/branches`, 'branch-status-message');
    setupFormSubmission('add-librarian-form', `${API_URL}/librarians`, 'librarian-status-message');
    setupFormSubmission('add-author-form', `${API_URL}/authors`, 'author-status-message');
    setupFormSubmission('add-book-form', `${API_URL}/books`, 'book-status-message', fetchAndDisplayBooks); // Refresh list on success
    setupFormSubmission('add-member-form', `${API_URL}/members`, 'member-status-message');
});

// ---------------------------
// 1. Tab Switching Functionality
// ---------------------------
function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove 'active' class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add 'active' class to the clicked tab
            tab.classList.add('active');

            // Show the corresponding content
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ---------------------------
// 2. Reusable Form Submission Function (for all CREATE operations)
// ---------------------------
function setupFormSubmission(formId, endpoint, messageId, successCallback = null) {
    const form = document.getElementById(formId);
    const statusMessage = document.getElementById(messageId);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusMessage.textContent = 'Submitting...';
        statusMessage.className = 'status-message'; 

        // 1. Collect form data into a plain JavaScript object
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            // Convert number fields to integers
            if (['Branch_ID', 'Librarian_ID', 'Author_ID', 'Year_of_publication'].includes(key)) {
                data[key] = isNaN(parseInt(value)) ? null : parseInt(value);
            } else {
                data[key] = value;
            }
        });

        try {
            // 2. Send POST request to the API
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            // 3. Handle response
            if (response.ok) {
                statusMessage.textContent = `${result.message} (ID: ${result.id || result.memberId})`;
                statusMessage.classList.add('success');
                form.reset();
                if (successCallback) {
                    successCallback(); // Run function to refresh book list
                }
            } else {
                // Display error message from the backend
                statusMessage.textContent = `Submission Failed! Error: ${result.error}`;
                statusMessage.classList.add('error');
            }

        } catch (error) {
            console.error(`Network error on form ${formId}:`, error);
            statusMessage.textContent = 'Network error. Could not connect to the server.';
            statusMessage.classList.add('error');
        }
    });
}


// ---------------------------
// 3. READ Operation (Books) - Refreshes the List
// ---------------------------
async function fetchAndDisplayBooks() {
    try {
        const response = await fetch(`${API_URL}/books`);
        const books = await response.json();
        const listElement = document.getElementById('books-list');
        listElement.innerHTML = '';

        if (books.length === 0) {
            listElement.innerHTML = '<li>No books found in the database.</li>';
            return;
        }

        books.forEach(book => {
            const listItem = document.createElement('li');
            listItem.textContent = `[${book.Book_ID}] ${book.Title} (ISBN: ${book.ISBN}) - Pub. Year: ${book.Year_of_publication || 'N/A'}`;
            listElement.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching books:', error);
        document.getElementById('books-list').innerHTML = '<li>Error loading data. Check server connection.</li>';
    }
}