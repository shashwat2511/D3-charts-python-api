(function(d3) {
        "use strict";

        let validateMessage = "";
        let isFormValidate = true;
        let baseUrl = "http://127.0.0.1:5000/";
        let apiUrl = "http://127.0.0.1:5000/api/v1/";
        let dataColumns;
        let uploadedFilename;
        let cvFileUrl;
        let plotImageUrl;

        const dropdownMenu = (selection, props) => {
            const {
                options,
                onOptionClicked,
                selectedOption
            } = props;

            let select = selection.selectAll('select').data([null]);
            select = select.enter().append('select')
                .merge(select)
                .on('change', function() {
                    onOptionClicked(this.value);
                });

            const option = select.selectAll('option').data(options);
            option.enter().append('option')
                .merge(option)
                .attr('value', d => d)
                .property('selected', d => d === selectedOption)
                .text(d => d);
        };

        let xColumn;
        let yColumn;

        const onXColumnClicked = column => {
            xColumn = column;
            renderDropdownMenu();
        };

        const onYColumnClicked = column => {
            yColumn = column;
            renderDropdownMenu();
        };
        const renderDropdownMenu = () => {
            d3.select('#x-menu')
                .call(dropdownMenu, {
                    options: dataColumns,
                    onOptionClicked: onXColumnClicked,
                    selectedOption: xColumn
                });

            d3.select('#y-menu')
                .call(dropdownMenu, {
                    options: dataColumns,
                    onOptionClicked: onYColumnClicked,
                    selectedOption: yColumn
                });
        }

        // $('#upload-file-btn').attr('disabled',true);
        $("#upload-file-btn").click(function(event) {
            event.preventDefault();

            if ($("input[name='includeHeader']:checked").val() === '') {
                isFormValidate = false;
                validateMessage += 'Include Header';
            }

            if ($("input[name='separators']:checked").val() === '') {
                isFormValidate = false;
                validateMessage += ('' !== validateMessage) ? '/Separator' : 'Separator';
            }

            if ($("#csv-file").val() === '') {
                isFormValidate = false;
                validateMessage += ('' !== validateMessage) ? '/Add Files' : 'Add Files';
            }

            if (false === isFormValidate) {
                validateMessage = 'Please fill input(s) for ' + validateMessage;
                alert(validateMessage);
                validateMessage = ""
                return 0;
            } else {
                let formData = new FormData();
                formData.append("include_header", $("input[name='includeHeader']:checked").val())
                formData.append("separator", $("input[name='separators']:checked").val())

                var files = $('#csv-file')[0].files[0];
                formData.append('csv-file', files);

                // this.setAttribute("disabled", "disabled");
                // this.classList.toggle("disableElement");

                // $('#csvFileUpload')[0].reset();
                // $('#upload-file-btn').attr('disabled',true);
                fileUpload(formData);
                // console.log(fileUploadResponse)
            }

        });

        function fileUpload(uploadFormData) {
            var serviceResponse = "";

            var settings = {
                url: apiUrl + "uploadFile",
                method: "POST",
                header: {
                    "Content-Type": "multipart/form-data",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token"
                },
                processData: false,
                contentType: false,
                data: uploadFormData
            };

            $.ajax(settings).done(function(response) {
                $('#upload-file-btn').attr('disabled', false);
                setFileName(response.filename);
                setCsvUrl(baseUrl + response.file_url);

                // sessionStorage.setItem("file_url", 'http://127.0.0.1:5000/'+ response.file_url);
                // callTimeSeriesPlot(baseUrl + response.file_url);
                getCsvDataTable(response.filename);
                setAxisColumns(response.filename);
                // console.log(response.filename)
                // return response;
            });
            // return serviceResponse;
        }

        function setFileName(filename) {
            uploadedFilename = filename
        }

        function setCsvUrl(fileurl) {
            cvFileUrl = fileurl
        }

        function getCsvDataTable(filename) {
            var serviceResponse = "";

            var settings = {
                url: apiUrl + "getCsvDataInHtml/" + filename,
                method: "GET",
                header: {
                    'Content-Type': 'application/json; charset=utf-8',
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST,OPTIONS",
                    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token"
                }
            };

            $.ajax(settings).done(function(response) {
                // console.log(response.dataframe)
                $(".display-return-data").html(response.dataframe);
                // csvData = response.dataframe;
                // return response;
            });
            return serviceResponse;
        }

        async function getColumnsList(filename) {
            let response = await fetch(apiUrl + "getCsvHeaders/" + filename);
            let dataColumsList = await response.json()
            return dataColumsList;
        }

        const setAxisColumns = (filename) => {
            getColumnsList(filename)
                .then((data) => {
                    dataColumns = data.dataframe;
                    renderDropdownMenu();
                });
        };

        async function getPlot(filename) {
            let settings = {
                method: "GET",
                header: {
                    "Content-Type": "multipart/form-data",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token"
                },
                processData: false,
                contentType: false
            };

            let getScatterPlotUrl = apiUrl + "getScatterPlot/" + filename + "?xaxis=" + xColumn + "&yaxis=" + yColumn;
            let response = await fetch(getScatterPlotUrl, settings);
            let dataColumsList = await response.json()
            return dataColumsList;
        }

        $("#get-plot-btn").click(function(event) {
            event.preventDefault();

            getPlot(uploadedFilename)
                .then((data) => {
                    plotImageUrl = apiUrl + "plot_image/" + data.plot_image_url;

                    $("#plotImage").attr('src', plotImageUrl);
                });
        });

        $("#sort-by-btn").click(function(event) {
            event.preventDefault();

            if ($("input[name='sortby']:checked").val() === '') {
                isFormValidate = false;
                validateMessage += ('' !== validateMessage) ? '/sortby' : 'sortby';
            }

            if (false === isFormValidate) {
                validateMessage = 'Please fill input(s) for ' + validateMessage;
                alert(validateMessage);
                validateMessage = ""
                return 0;
            } 
            else {
                callTimeSeriesPlot(cvFileUrl);
            }

        });






        const svg = d3.select('svg');

        const width = +svg.attr('width');
        const height = +svg.attr('height');

        const render = data => {
            const title = 'Time Series';

            const xValue = d => d.PERIOD_DATE;
            const xAxisLabel = 'PERIOD DATE';

            const yValue = d => d.AMOUNT_in_Billion;
            const yAxisLabel = 'AMOUNT in Billion';

            const margin = {
                top: 60,
                right: 40,
                bottom: 88,
                left: 105
            };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            const xScale = d3.scaleTime()
                .domain(d3.extent(data, xValue))
                .range([0, innerWidth])
                .nice();

            const yScale = d3.scaleLinear()
                .domain(d3.extent(data, yValue))
                .range([innerHeight, 0])
                .nice();

            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            const xAxis = d3.axisBottom(xScale)
                .tickSize(-innerHeight)
                .tickPadding(15);

            const yAxis = d3.axisLeft(yScale)
                .tickSize(-innerWidth)
                .tickPadding(10);

            const yAxisG = g.append('g').call(yAxis);
            yAxisG.selectAll('.domain').remove();

            yAxisG.append('text')
                .attr('class', 'axis-label')
                .attr('y', -60)
                .attr('x', -innerHeight / 2)
                .attr('fill', 'black')
                .attr('transform', `rotate(-90)`)
                .attr('text-anchor', 'middle')
                .text(yAxisLabel);

            const xAxisG = g.append('g').call(xAxis)
                .attr('transform', `translate(0,${innerHeight})`);

            xAxisG.select('.domain').remove();

            xAxisG.append('text')
                .attr('class', 'axis-label')
                .attr('y', 80)
                .attr('x', innerWidth / 2)
                .attr('fill', 'black')
                .text(xAxisLabel);

            const lineGenerator = d3.line()
                .x(d => xScale(xValue(d)))
                .y(d => yScale(yValue(d)));

            g.append('path')
                .attr('class', 'line-path')
                .attr('d', lineGenerator(data));

            g.selectAll('circle').data(data)
                .enter().append('circle')
                .attr('cy', d => yScale(yValue(d)))
                .attr('cx', d => xScale(xValue(d)))
                .attr('r', 2.5);
        

        g.append('text')
            .attr('class', 'title')
            .attr('y', -10)
            .text(title);
    };

    function callTimeSeriesPlot(filepath) {
        d3.csv(filepath)
            .then(loadedData => {
                console.log(loadedData);
                let nested_data = d3.nest()
                    .key(function(d) {
                        return (new Date(d.PERIOD_DATE).getTime());
                    })
                    .sortKeys(d3.ascending)
                    .rollup(function(leaves) {
                        return {
                            AMOUNT: d3.sum(leaves, function(d) {
                                return (+d.AMOUNT);
                            })
                        };
                    })
                    .entries(loadedData);

                let aggregatedData = nested_data.map(function(d) {
                    let final_structure = {
                        "PERIOD_DATE": new Date(+d.key),
                        "AMOUNT": +d.value.AMOUNT,
                        "AMOUNT_in_Billion": (+d.value.AMOUNT) / 1000000000
                    };
                    return final_structure;
                });
                aggregatedData.columns = ["PERIOD_DATE", "AMOUNT", "AMOUNT_in_Billion"];
                // loadedData.forEach(d => {
                //     d.PERIOD_DATE = new Date(d.PERIOD_DATE);
                //     d.AMOUNT = +d.AMOUNT;
                //     d.AMOUNT_in_Billion = (+d.AMOUNT) / 1000000000;
                // });
                // loadedData.columns.push("AMOUNT_in_100K");

                render(aggregatedData);
            });
    }
    d3.csv('http://127.0.0.1:5000/api/v1/uploads/system_subSet.csv')
    .then(loadedData => {
        // data = loadedData;

        let nested_data = d3.nest()
            .key(function(d) {
                return (new Date(d.PERIOD_DATE).getTime());
            })
            .sortKeys(d3.ascending)
            .rollup(function(leaves) {
                return {
                    AMOUNT: d3.sum(leaves, function(d) {
                        return (+d.AMOUNT);
                    })
                };
            })
            .entries(loadedData);

        // console.log(nested_data);
        let aggregatedData = nested_data.map(function(d) {
            let final_structure = {
                "PERIOD_DATE": new Date(+d.key),
                "AMOUNT": +d.value.AMOUNT,
                "AMOUNT_in_Billion": (+d.value.AMOUNT) / 1000000000
            };
            return final_structure;
        });
        aggregatedData.columns = ["PERIOD_DATE", "AMOUNT", "AMOUNT_in_Billion"];
        render(aggregatedData);
    });

}(d3));