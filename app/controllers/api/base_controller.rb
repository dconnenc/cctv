class Api::BaseController < ApplicationController
  authorize :user, through: :current_user
end
