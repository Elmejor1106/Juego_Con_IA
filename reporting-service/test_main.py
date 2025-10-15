import pytest
from main import app

def test_app_initialization():
    assert app is not None, "The app should be initialized properly"

# Add more tests as needed