# README

## Setup

- `yarn install`
- `bundle install`
- `bundle exec rake db:create db:migrate`
- `bundle exec rake db:seed`
- `gem install foreman`
- `foreman start -f Procfile.dev`

### To reset the env

`bundle exec rake db:drop`

**Then run the setup steps**

### Create a new experience

- `> Experience.create(code: "some code")`

### Destroying an existing experience

- `> experience = Experience.find_by(code: "some code")`
- `> experience.destroy`

## Deployments

Merging to main is fine for now, this project is still in a prototype and there are no negative consequences that can occur.

Make sure to push up the main branch if you merge it locally and want to deploy

- Navigate to the [cctv render web service](https://dashboard.render.com/web/srv-d2tep43uibrs73entts0)
- Click Manual Deploy and either select a commit, or commit the latest if you've just merged
