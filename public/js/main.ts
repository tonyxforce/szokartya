import { httpGet, getCookie, setCookie, httpJsonGet, httpJsonPost } from "./tools"
require("./jquery-3.7.1.min.js");
import $ from "../../node_modules/@types/jquery/index";
import * as bs from "../../node_modules/@types/bootstrap/index";


$(function () {
	var _count = $("#count")[0] as HTMLInputElement;
	var _start = $("#start")[0] as HTMLButtonElement;
	var _countLabel = $("#countLabel")[0] as HTMLLabelElement;
	var _main = $("#main")[0] as HTMLDivElement;
	var _check = $("#check")[0] as HTMLSpanElement;
	var _add = $("#add")[0] as HTMLSpanElement;
	var _retry = $("#retry")[0] as HTMLSpanElement;

	_count.onkeydown = () => {
	}

	_retry.onclick = () => {
		httpJsonGet(`${apiPath}/clearNoRepeat`);

		_retry.classList.add("d-none");
		_check.classList.remove("d-none");

		_main.innerHTML = "";
		_start.click();
	}

	_add.onclick = () => {
		location.replace("/add.html");
	}

	var apiPath = "/api/v1";

	_count.value = getCookie("count") || '5';

	httpJsonGet(`${apiPath}/clearNoRepeat`);

	_count.onchange = () => {
		_count.value = String(Math.min(maxCount, Math.max(Number(_count.value), 1)));
		setCookie("count", Number(_count.value));
	}

	var maxCount = Number(httpGet(`${apiPath}/getCount`)) - 1
	console.log(maxCount)
	_count.setAttribute("max", String(maxCount));
	if (Number(_count.value) > maxCount) {
		_count.value = String(maxCount);
	}


	_start.onclick = () => {
		_count.value = String(Math.min(maxCount, Math.max(Number(_count.value), 1)));
		_count.classList.add("d-none");
		_start.classList.add("d-none");
		_countLabel.classList.add("d-none");
		_check.classList.remove("d-none");
		_add.classList.add("d-none");

		var count = Number(_count.value);
		for (let i = 0; i < count; i++) {
			var text = httpJsonGet(`${apiPath}/getRandom?noRepeat=true`);
			if (text.error) {

				console.log(text);

			} else {

				var __div = document.createElement("div");
				__div.classList.add("mb-3");

				var __label = document.createElement("label");
				__label.setAttribute("for", `text${i}`);

				__label.innerText = text.meanings.orig.word + ":";


				var __text = document.createElement("input");
				__text.type = "text";
				__text.id = `text${i}`
				__text.classList.add("form-control");

				__div.appendChild(__label);
				__div.appendChild(__text);
				_main.appendChild(__div);

			}
		}
	}


	_check.onclick = () => {
		_retry.classList.remove("d-none");
		_check.classList.add("d-none");


		Array.prototype.forEach.call($("#main")[0].childNodes, (e: HTMLDivElement, i: number) => {

			console.log(i, e);
			var qEl = e.children[0] as HTMLLabelElement
			var q = qEl.innerText || "BUG";

			var ansEl: HTMLInputElement = e.children[1] as HTMLInputElement
			var ans = ansEl.value || "";

			console.log(q, ans)

			ansEl.classList.remove("is-invalid")
			ansEl.setAttribute("disabled", "true");
			if (!ans) {
				ansEl.classList.add("is-invalid");
				return;
			}

			var ret = httpJsonGet(`${apiPath}/guess`, {
				guessLang: "fi",
				guessWord: ans || "$empty$",
				lang: "hu",
				word: q.replace(":", "") || "BUG",
			});

			if (ret.error) {
				console.log(ret)
			} else {
				if (ret.res) {
					ansEl.classList.add("is-valid");
					//data-toggle="tooltip" data-placement="right" title="Tooltip on right"
				} else {
					ansEl.classList.add("is-invalid");
					$(`#${ansEl.id}`).tooltip({
						title: ret.correct,
						trigger: 'hover',
						placement: "right"
					});
				}
			}

		});
	}
})