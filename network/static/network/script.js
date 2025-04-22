function new_post(){
    document.querySelector('#new-post').style.display = 'block';
    document.querySelector('#all-posts').style.display = 'none';
    document.querySelector('#followings').style.display = 'none';

    const submitbutton = document.querySelector("#submit-post");

    submitbutton.onclick = (event)=>{
        event.preventDefault();
        const content = document.querySelector("#post-content");
        fetch('/new_post',{
            method: 'POST',
            body: JSON.stringify({
                content: content.value,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => response.json())
        .then(result=>{
            if(result.error){
                console.error('Error: ', result.error);
                alert(result.error);
            }
            if(result.message){
                console.log(result.message);
                showNotification('Post created successfully!');
                document.querySelector('#post-content').value = '';
            }  
        })
        .catch(error =>{
            console.error('Error: ', error);
        });
    };
}

function all_posts(page=1){
    document.querySelector('#new-post').style.display = 'none';
    document.querySelector('#all-posts').style.display = 'block';
    document.querySelector('#followings').style.display = 'none';

    const postsContainer = document.querySelector('#posts-container');
    postsContainer.innerHTML = '';

    fetch(`/all_posts?page=${page}`)
        .then(response=>response.json())
        .then(data=>{
            data.posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.style.border = '1px solid black';
                postDiv.className = 'post';
                postDiv.style.marginBottom= '5px';
                postDiv.style.padding = '10px';
                postDiv.id = `post-content-${post.id}`
                
                postDiv.innerHTML=`
                <b>Posted by: </b>
                <a href="#" class="username-link" ">${post.creator}</a><br>
                <b>Publication date:  </b>${post.time}<br>
                <br>
                <p id="finalcontent">${post.content}</p><br>
                <b>Likes: </b><span id="like-count-${post.id}">${post.likes}</span> ❤️<br>
                `
                postDiv.querySelector('.username-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Stops the anchor from reloading the page
                    load_profile(post.creator); // Triggers the profile function
                });

                if(post.creator == document.querySelector('[data-username]').getAttribute('data-username')){
                    const editButton = document.createElement('button');
                    editButton.textContent = "Edit";
                    editButton.className = 'btn btn-secondary';
                    editButton.onclick = () => {
                        showEdit(post.id, post.content);
                    };
                    postDiv.appendChild(editButton);
                }
                const likeButton = document.createElement('button');
                likeButton.id = `like-button-${post.id}`;
                likeButton.textContent = post.liked ? "Unlike" : "Like";
                likeButton.className = 'btn btn-primary';
                likeButton.onclick = () => like_unlike(post.id);

                postDiv.appendChild(likeButton);
                
                postsContainer.append(postDiv)
            });

            const prevButton = document.querySelector('#prev-page');
            const nextButton = document.querySelector('#next-page');
            prevButton.style.display = data.has_prev ? 'inline': 'none';
            nextButton.style.display = data.has_next ? 'inline': 'none';
            if(data.has_prev){
                prevButton.onclick = ()=>{
                    all_posts(page - 1);
                }
            }
            if(data.has_next){
                nextButton.onclick = () =>{
                    all_posts(page + 1);
                }
            }
        })

        .catch(error=>{
            console.error('Error: ', error);
            alert('An error has occured while loading the pages :/.');
        });
    }


function like_unlike(post_id){
    fetch(`/like_unlike/${post_id}`,{
        method: 'PUT',
        headers:{'Content-Type': 'application/json'}
    })
    .then(response=>response.json())
    .then(result=>{
        if(result.error){
            console.error("Error: ", result.error)
            alert(result.error)
        }
        else{
            const likeButton = document.querySelector(`#like-button-${post_id}`);
            const likeCount = document.querySelector(`#like-count-${post_id}`);

            likeButton.textContent = result.liked ? "Unlike" : "Like";
            likeCount.textContent = result.like_count;
        }
    })
    .catch(error=>{
        console.error("Error: ", error);
        alert('An error ahs occured while changing the like status')
    });
}


function showEdit(post_id, oldContent){
    const postContentDiv = document.querySelector(`#post-content-${post_id}`)
    postContentDiv.innerHTML = `
    <textarea id="edit-content-${post_id}" class="form-control">${oldContent}</textarea>
    <button class="btn btn-primary mt-2" onclick="saveEdit(${post_id})">Save</button>
    <button class="btn btn-secondary mt-2" onclick="cancelEdit(${post_id}, '${oldContent}')">Cancel</button>
    `
}

function saveEdit(post_id){
    const newcontent = document.querySelector(`#edit-content-${post_id}`).value.trim();
    
    fetch(`/edit_post/${post_id}`,{
        method: 'PUT',
        body: JSON.stringify({content: newcontent,}),
        headers: {'Content-Type': 'application/json'},
    })
    .then(response=>response.json())
    .then(result=>{
        if(result.error){
            console.error('Error: ', result.error);
            alert(result.error);
        }
        else{
            console.log(result.message);

            all_posts();

            // Show success notification
            showNotification('Content updated successfully');
        }
    })

    .catch(error=>{
        console.error("Error: ", error);
    });
}

function cancelEdit(post_id, oldcontent){
    all_posts();
}

function showNotification(message) {
    const notification = document.querySelector('#notification');
    notification.textContent = message;
    notification.style.display = 'block';

    notification.classList.add('animate');

    setTimeout(() => {
        // Remove animation and hide after animation ends
        notification.classList.remove('animate');
        notification.style.display = 'none';
    }, 3000);
}


function load_profile(username, page = 1){
    document.querySelector('#new-post').style.display = 'none';
    document.querySelector('#all-posts').style.display = 'block';
    document.querySelector('#followings').style.display = 'none';

    const postsContainer = document.querySelector('#posts-container');
    postsContainer.style.display='block'
    postsContainer.innerHTML = ''; // Clear the container for new content
    fetch(`/profile/${username}?page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched profile data:", data);
            //Profile info
            const profileInfo = document.createElement('div');
            profileInfo.className = 'profile-info';
            profileInfo.style.borderBottom = '1px solid gray';
            profileInfo.style.marginBottom = '20px';
            profileInfo.style.padding = '10px';

            profileInfo.innerHTML = `
                <h3>${data.username}</h3>
                <p><strong>Followers:</strong> ${data.followers_number}</p>
                <p><strong>Following:</strong> ${data.followings_number}</p>
            `;

            const loggedInUsername = document.querySelector('[data-username]').getAttribute('data-username');
            console.log(document.querySelector('[data-username]').getAttribute('data-username'));

            if (data.username !== loggedInUsername) {
                const followButton = document.createElement('button');
                followButton.textContent = data.is_following ? 'Unfollow' : 'Follow';
                followButton.className = 'btn btn-primary';
                followButton.style.marginTop = '10px';

                followButton.onclick = () => {
                    console.log("Follow button clicked");
                    follow_unfollow(username, data.is_following);
                };

                profileInfo.append(followButton);
            }

            postsContainer.append(profileInfo);

            data.posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'post';
                postDiv.style.border = '1px solid black';
                postDiv.style.padding = '10px';
                postDiv.style.marginBottom = '10px';

                postDiv.innerHTML = `
                    <p>${post.content}</p>
                    <p><small>${post.time}</small></p>
                    <p><strong>Likes:</strong> ${post.likes} ❤️</p>
                `;

                postsContainer.append(postDiv);
            });

            const prevButton = document.querySelector('#prev-page');
            const nextButton = document.querySelector('#next-page');

            prevButton.style.display = data.has_prev ? 'inline' : 'none';
            nextButton.style.display = data.has_next ? 'inline' : 'none';

            if (data.has_previous) {
                prevButton.onclick = () => load_profile(username, page - 1);
            }
            if (data.has_next) {
                nextButton.onclick = () => load_profile(username, page + 1);
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
        });
        console.log("Load profile function called")
}

function follow_unfollow(username, is_following){

    fetch(`profile/${username}/follow_unfollow`,{
        method: 'PUT',
        body: JSON.stringify({
            "is_following": is_following,
            "user": username,
        }),
        headers: {'Content-Type': 'application/json'}
    })
        .then(response=>{
                        if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result=>{
            if(result.error){
                console.error("Error: ", result.error);
                alert(result.error);
            }
            else{
                console.log(result.message)
                showNotification(`${result.message}`)
                document.querySelector('.profile-info p:nth-child(2)').innerHTML = `<strong>Followers:</strong> ${result.followers_count}`;

                const followButton = document.querySelector('.profile-info button');
                followButton.textContent = is_following ? 'Follow' : 'Unfollow';
                followButton.onclick = () => follow_unfollow(username, !is_following);

            }
        })

        .catch(error=>{
            console.error("Error: ", error)
            alert(error)
        });
    console.log("follow_unfollow function called")
}


function following_posts( page = 1){
    document.querySelector('#new-post').style.display = 'none';
    document.querySelector('#all-posts').style.display = 'block';
    document.querySelector('#followings').style.display = 'none';

    const postsContainer = document.querySelector('#posts-container');
    postsContainer.innerHTML = '';

    fetch(`/following?page=${page}`)
        .then(response=>response.json())
        .then(data=>{
            data.posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.style.border = '1px solid black';
                postDiv.className = 'post';
                postDiv.style.marginBottom= '5px';
                postDiv.style.padding = '10px';
                postDiv.id = `post-content-${post.id}`
                
                postDiv.innerHTML=`
                <b>Posted by: </b>
                <a href="#" class="username-link" ">${post.creator}</a><br>
                <b>Publication date:  </b>${post.time}<br>
                <br>
                <p id="finalcontent">${post.content}</p><br>
                <b>Likes: </b><span id="like-count-${post.id}">${post.likes}</span> ❤️<br>
                `
                postDiv.querySelector('.username-link').addEventListener('click', (event) => {
                    event.preventDefault(); // Stops the anchor from reloading the page
                    load_profile(post.creator); // Triggers the profile function
                });

                if(post.creator == document.querySelector('[data-username]').getAttribute('data-username')){
                    const editButton = document.createElement('button');
                    editButton.textContent = "Edit";
                    editButton.className = 'btn btn-secondary';
                    editButton.onclick = () => {
                        showEdit(post.id, post.content);
                    };
                    postDiv.appendChild(editButton);
                }
                const likeButton = document.createElement('button');
                likeButton.id = `like-button-${post.id}`;
                likeButton.textContent = post.liked ? "Unlike" : "Like";
                likeButton.className = 'btn btn-primary';
                likeButton.onclick = () => like_unlike(post.id);

                postDiv.appendChild(likeButton);
                
                postsContainer.append(postDiv)
            });

            const prevButton = document.querySelector('#prev-page');
            const nextButton = document.querySelector('#next-page');
            prevButton.style.display = data.has_prev ? 'inline': 'none';
            nextButton.style.display = data.has_next ? 'inline': 'none';
            if(data.has_prev){
                prevButton.onclick = ()=>{
                    all_posts(page - 1);
                }
            }
            if(data.has_next){
                nextButton.onclick = () =>{
                    all_posts(page + 1);
                }
            }
        })

        .catch(error=>{
            console.error('Error: ', error);
            alert('An error has occured while loading the pages :/.');
        });
}