// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        user_email: user_email,
        username: username,
        posts: [],
        post: '',
        posting: false,
        error: false,
        active: false,
    };

    // called during refresh
    app.reindex = (a) => {
        let idx = 0;
        for (p of a) {
            p._idx = idx++;
            p.likers = [];
            p.dislikers = [];
            p.known_likers = false;
        }
        return a;
    };

    //rate a post, if the same rating occurs, undo the rating
    app.rate = (rating, post) => {
        let idx = app.vue.posts.indexOf(post)
        let p = app.vue.posts[idx]
        if (p.likers.includes(username) && rating == 1){
            rating = 0
        }
        if (p.dislikers.includes(username) && rating == -1){
            rating = 0
        }
        axios.post(set_thumbs_url, { post_id: p.id, rating: rating, name:username}).then(() => {
            // post.known_likers = false; //uncomment this and line 65 to prevent server calls everytime a mouseenter occurs
            app.getThumbs(post)
        })
    }

    //Add a post, if post is not empty
    app.add_post = () => {
        if (app.vue.post.trim() == '') {
            app.vue.post = '';
            app.vue.error = true;
            setTimeout(()=>{app.vue.error = false},2500)
        }
        else {
            axios.post(post_url, { content: app.vue.post, name:username }).then(() => {
                app.vue.post = '';
                app.refresh();
            })
        }
    }

    //Make ajax call to get thumbs for a given post
    app.getThumbs = (post) => {
        // if (post.known_likers) return; //the caveat with this flag method is it won't dynamically refresh for other simultaneous users, and will need a state change to trigger the update on their end
        axios.get(get_thumbs_url, {params: {id: post.id}}).then(res => {
            let thumbs = res.data.thumbs
            let likes = thumbs.filter(item => item.rating == 1)
            let dislikes = thumbs.filter(item => item.rating == -1)
            let likers =  [];
            let dislikers = [];
            for (entry of likes){
                likers.push(entry.name)
            }
            for (entry of dislikes){
                dislikers.push(entry.name)
            }
            post['likers'] = likers
            post['dislikers'] = dislikers
            post.known_likers = true;
        })
    }

    //Gets all posts from db
    app.refresh = () => {
        axios.get(get_posts_url).then(res => {
            app.vue.posts = app.reindex(res.data.posts).reverse();
            for (post of app.vue.posts){
                app.getThumbs(post)
            }
        })
    }

    //Removes post from db
    app.remove = (post) => {
        axios.post(delete_url, { post: post }).then(() => app.refresh())
    }
    
    // We form the dictionary of all methods, so we can assign them
    // to the Vue app in a single blow.
    app.methods = {
        getThumbs: app.getThumbs,
        refresh: app.refresh,
        rate: app.rate,
        add_post: app.add_post,
        remove: app.remove,
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        app.refresh();
    };

    // Call to the initializer.
    app.init();
};

init(app);
