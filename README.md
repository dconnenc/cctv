# README

## Setup

* `yarn install`
* `bundle install`
* `bundle exec rake db:create db:migrate`
* `gem install foreman`
* `foreman start -f Procfile.dev`

## Testing

To test, create a new "session" from the console:

* `bundle exec rails c`
* `> Session.create(code: "some code")`
