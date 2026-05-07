from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        data = {
            "total_length": request.form.get("total_length"),
            "upper_height": request.form.get("upper_height"),
            "lower_height": request.form.get("lower_height"),
            "holes": request.form.getlist("holes[]"),
            "concrete_thickness": request.form.get("concrete_thickness"),
            "step_height": request.form.get("step_height"),
        }

        print("DATA:", data)

        # TODO: gọi hàm vẽ CAD/PDF ở đây

    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)