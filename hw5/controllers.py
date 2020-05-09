"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

import uuid

from py4web import action, request, abort, redirect, URL, Field
from py4web.utils.form import Form, FormStyleBulma
from py4web.utils.url_signer import URLSigner

from yatl.helpers import A
from . common import db, session, T, cache, auth, signed_url
from . models import get_user_email

url_signer = URLSigner(session)

# The auth.user below forces login.
@action('index')
@action.uses(url_signer, auth.user, 'index.html')
def index():
    return dict(
        get_posts_url = URL('get_posts', signer=url_signer),
        get_thumbs_url = URL('get_thumbs', signer=url_signer),
        set_thumbs_url = URL('set_thumbs', signer=url_signer),
        post_url = URL('add_post', signer=url_signer),
        delete_url = URL('delete', signer=url_signer),
        user_email = get_user_email(),
        username = auth.current_user.get('first_name') + " " + auth.current_user.get("last_name")
    )

@action('get_posts')
@action.uses(url_signer.verify(), auth.user)
def get_posts():
    posts = db(db.post).select().as_list()
    for post in posts:
        r = db(db.auth_user.email==post['user_email']).select().first()
        name = r.first_name + " " + r.last_name if r is not None else "Unknown"    
        post['name'] = name
    return dict(posts=posts)

@action('get_thumbs')
@action.uses(url_signer.verify(), auth.user)
def get_thumbs():
    id = request.params.get('id')
    thumbs = db(db.thumb.post_id == id).select().as_list()
    for thumb in thumbs:
        r = db(db.auth_user.email==thumb['user_email']).select().first()
        name = r.first_name + " " + r.last_name if r is not None else "Unknown"    
        thumb['name'] = name
    return dict(thumbs=thumbs)

@action('set_thumbs', method="POST")
@action.uses(url_signer.verify(), auth.user, db)
def set_thumbs():
    name = request.json.get('name')
    user = auth.current_user.get('email')
    id = request.json.get('post_id')
    rating = request.json.get('rating')
    record = db.post[id]
    db.thumb.update_or_insert(((db.thumb.user_email == user) & (db.thumb.post_id == id)), user_email=user, post_id=id, rating=rating, name=name)

@action('add_post', method="POST")
@action.uses(url_signer.verify(), auth.user, db)
def add_post():
    username = request.json.get('name')
    content = request.json.get('content')
    user = auth.current_user.get('email')
    # print(f"post by {user} message: {content}")
    assert user is not None and content is not None
    db.post.insert(post_text=content, user_email=user, name=username)
    # return dict()

@action('delete', method=['POST'])
@action.uses(auth.user, url_signer.verify(), session, db)
def delete():
    user = auth.current_user.get('email')
    post = request.json.get('post')
    email = post['user_email']
    id = post['id']
    if (user == email):
        # print("removing post", id)
        del db.post[id]