# README

## Setup

* `yarn install`
* `bundle install`
* `bundle exec rake db:create db:migrate`
* `gem install foreman`
* `foreman start -f Procfile.dev`

## Testing

`bundle exec rails c`

### Create a new session

* `> Session.create(code: "some code")`

### Destroying an existing session

* `> session = Session.find_by(code: "some code")`
* `> session.destroy`

## Setting up Sessions in Production

* Navigate to the [cctv render web service](https://dashboard.render.com/web/srv-d2tep43uibrs73entts0)
* Click Connect > ssh and copy the cmd
* Run the cmd from a terminal. It'll look like `ssh srv-xxx@ssh.oregon.render.com`
* run `cd /rails` this will take you the project directory
* run `bundle exec rails c`
* From here you can run any command listed above in the testing section.

## Deployments

Merging to main is fine for now, this project is still in a prototype and there are no negative consequences that can occur.

Make sure to push up the main branch if you merge it locally and want to deploy

* Navigate to the [cctv render web service](https://dashboard.render.com/web/srv-d2tep43uibrs73entts0)
* Click Manual Deploy and either select a commit, or commit the latest if you've just merged
